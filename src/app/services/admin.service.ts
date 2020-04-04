// import { AdminInterfaceService } from './admin-interface.service';

import {Injectable} from '@angular/core';
import {HttpHeaders, HttpClient, HttpResponse, HttpRequest} from '@angular/common/http';
import {Observable, of} from 'rxjs';
import {Item} from '../models/Item';
import {AngularFirestore} from '@angular/fire/firestore';
import {AuthService} from './auth.service';
import {SentReport} from '../models/SentReport';
import {map} from 'rxjs/operators';
import {HierarchyItem} from '../models/HierarchyItem';
import {SearchService} from './search.service';
import { combineLatest } from 'rxjs';
import { User } from '../models/User';
import * as firebase from "firebase";

declare var require: any;

const httpOptions = {
  headers: new HttpHeaders({
    'Content-Type': 'application/json'
  })
};

const adServe = 'https://placewise-d040e.appspot.com/';

@Injectable({
  providedIn: 'root'
})
export class AdminService {
  placeReport(itemID: string, text: string): Observable<boolean> {
    var userID: string;
    this.auth.getAuth().subscribe(x => this.placeReportHelper(itemID, text, x.uid))


    return of(true);
  }

  placeReportHelper(itemID: string, text: string, userID: string) {
    this.afs.collection('/Workspaces/' + this.auth.workspace.id + '/Reports').add({
      desc: text,
      item: itemID,
      user: userID,
      date: new Date()
    });
  }

  getReports(): Observable<SentReport[]> {
    console.log('/Workspaces/' + this.auth.workspace.id + '/Reports');
    return this.afs.collection<SentReport>('/Workspaces/' + this.auth.workspace.id + '/Reports').snapshotChanges().pipe(
      map(a => {
        return a.map(g => {
            const data = g.payload.doc.data() as SentReport;
            data.ID = g.payload.doc.id;
            return data;
          }
        );
      }));
  }

  deleteReport(id: string) {
    this.afs.doc<Item>('/Workspaces/' + this.auth.workspace.id + '/Reports/' + id).delete();
  }

  clearReports(reports: SentReport[]): Observable<boolean> {
    for (let i = 0; i < reports.length; i++) {
      this.afs.doc<Item>('/Workspaces/' + this.auth.workspace.id + '/Reports/' + reports[i].ID).delete();
    }
    reports = [];
    return of(true);
  }

  updateItem(item: Item, oldCategoryID: string, oldLocationsID: string[]): Observable<boolean> {
    this.afs.doc<Item>('/Workspaces/' + this.auth.workspace.id + '/Items/' + item.ID).set(item);
    if (oldCategoryID) {
      // Remove from old category
      this.afs.doc('Workspaces/' + this.auth.workspace.id + '/Category/' + oldCategoryID).update({items: firebase.firestore.FieldValue.arrayRemove(item.ID)});
      // Add to new category
      this.afs.doc('Workspaces/' + this.auth.workspace.id + '/Category/' + item.category).update({items: firebase.firestore.FieldValue.arrayUnion(item.ID)});
    }
    if (oldLocationsID && oldLocationsID.length > 0) {
      // Remove from old locations
      oldLocationsID.forEach(location => {
        // If this location is no longer present
        if (item.locations.indexOf(location) === -1) {
          this.afs.doc('Workspaces/' + this.auth.workspace.id + '/Locations/' + location).update({items: firebase.firestore.FieldValue.arrayRemove(item.ID)});
        }
      });
      // Add to new locations
      item.locations.forEach(location => {
        this.afs.doc('Workspaces/' + this.auth.workspace.id + '/Locations/' + location).update({items: firebase.firestore.FieldValue.arrayUnion(item.ID)});
      });
    }
    return of(true);
  }

  createItem(item: Item): Observable<boolean> {
    this.afs.collection('/Workspaces/' + this.auth.workspace.id + '/Items').add({
      item
    });
    return of(true);
  }

  createItemAtLocation(name: string, desc: string, tags: string[], category: string, imageUrl: string, location: string) {
    if (!category) {
      category = 'root';
    }
    if (!location) {
      location = 'root';
    }
    return this.afs.collection('/Workspaces/' + this.auth.workspace.id + '/Items').add({
      name: name,
      desc: desc,
      tags: tags,
      locations: [location],
      category: category,
      imageUrl: imageUrl
    }).then(
      val => {
        this.afs.doc<HierarchyItem>('/Workspaces/' + this.auth.workspace.id + '/Locations/' + location).get().pipe(
          map(doc => doc.data())
        ).toPromise().then(
          doc => {
            const ary = (typeof doc.items === 'undefined' || doc.items === null) ? [] : doc.items;
            ary.push(val.id);
            this.afs.doc('Workspaces/' + this.auth.workspace.id + '/Locations/' + location).update({items: ary});
          }
        );
        this.afs.doc<HierarchyItem>('/Workspaces/' + this.auth.workspace.id + '/Category/' + category).get().pipe(
          map(doc => doc.data())
        ).toPromise().then(
          doc => {
            const ary = (typeof doc.items === 'undefined' || doc.items === null) ? [] : doc.items;
            ary.push(val.id);
            this.afs.doc('Workspaces/' + this.auth.workspace.id + '/Category/' + category).update({items: ary});
          }
        );
      }
    );

    //return of(true);
  }

  removeItem(item: Item) {
    this.afs.doc<Item>('/Workspaces/' + this.auth.workspace.id + '/Items/' + item).delete();
    if (item.category) {
      this.afs.doc('Workspaces/' + this.auth.workspace.id + '/Category/' + item.category).update({items: firebase.firestore.FieldValue.arrayRemove(item.ID)});
    }
    if (item.locations && item.locations.length > 0) {
      item.locations.forEach(location => {
        this.afs.doc('Workspaces/' + this.auth.workspace.id + '/Locations/' + location).update({items: firebase.firestore.FieldValue.arrayRemove(item.ID)});
      });
    }
    return of(true);
  }

  updateHierarchyPosition(parentID: number, moveID: number) {
    throw new Error('Method not implemented.');
  }

  updateLocationPosition(parentID: string, moveID: string, oldParent: string) {
    // update new parent id
    this.afs.doc<HierarchyItem>('/Workspaces/' + this.auth.workspace.id + '/Locations/' + moveID).update({
      parent: parentID
    });
    // remove from old parent's child list
    this.afs.doc<HierarchyItem>('/Workspaces/' + this.auth.workspace.id + '/Locations/' + oldParent).get().pipe(
      map(doc => doc.data())
    ).toPromise().then(
      doc => {
        let ary: string[] = (typeof doc.children === 'undefined' || doc.children === null) ? [] : doc.children;
        // ary.remove(moveID);
        ary = ary.filter(obj => obj !== moveID);
        this.afs.doc('Workspaces/' + this.auth.workspace.id + '/Locations/' + oldParent).update({children: ary});
      }
    );
    // Add to new parent's list
    this.afs.doc<HierarchyItem>('/Workspaces/' + this.auth.workspace.id + '/Locations/' + parentID).get().pipe(
      map(doc => doc.data())
    ).toPromise().then(
      doc => {
        const ary = (typeof doc.children === 'undefined' || doc.children === null) ? [] : doc.children;
        ary.push(moveID);
        this.afs.doc('Workspaces/' + this.auth.workspace.id + '/Locations/' + parentID).update({children: ary});
      }
    );
  }

  addLocation(newItem: HierarchyItem, newParentID: string) {
    newItem.ID = newItem.name + Math.round((Math.random() * 1000000));
    this.afs.doc<HierarchyItem>('/Workspaces/' + this.auth.workspace.id + '/Locations/' + newItem.ID).set(newItem);
    this.afs.doc<HierarchyItem>('/Workspaces/' + this.auth.workspace.id + '/Locations/' + newParentID).get().pipe(
      map(doc => doc.data())
    ).toPromise().then(
      doc => {
        const ary = (typeof doc.children === 'undefined' || doc.children === null) ? [] : doc.children;
        ary.push(newItem.ID);
        this.afs.doc('Workspaces/' + this.auth.workspace.id + '/Locations/' + newParentID).update({children: ary});
      }
    );
  }

  removeLocation(remove: HierarchyItem) {
    // Remove from parent and promote children and items to parent
    this.afs.doc<HierarchyItem>('/Workspaces/' + this.auth.workspace.id + '/Locations/' + remove.parent).get().pipe(
      map(doc => doc.data())
    ).toPromise().then(
      doc => {
        // Update parent's children
        let newChildren: string[] = (typeof doc.children === 'undefined' || doc.children === null) ? [] : doc.children;
        newChildren = newChildren.filter(obj => obj !== remove.ID);
        if (remove.children) {
          newChildren.concat(remove.children);
          // Update children's parents
          remove.children.forEach(child => this.afs.doc('Workspaces/' + this.auth.workspace.id + '/Locations/' + child).update({parent: remove.parent}));
        }
        // Update parent's items
        const newItems: string[] = (typeof doc.items === 'undefined' || doc.items === null) ? [] : doc.items;
        if (remove.items) {
          newItems.concat(remove.items);
          // Update item's parents
          remove.items.forEach(item => {
            this.searchService.getItem(item).subscribe(i => {
              // Remove the location from the items locations
              i.locations = i.locations.filter(id => id !== remove.ID);
              // Add the new parent to the items locations
              if (i.locations.indexOf(remove.parent) === -1) {
                i.locations.push(remove.parent);
              }
              console.log(i);
              this.updateItem(i, null, null);
            });
          });
        }
        this.afs.doc('Workspaces/' + this.auth.workspace.id + '/Locations/' + remove.parent).update({
          children: newChildren,
          items: newItems
        });
      }
    );
    this.afs.doc<HierarchyItem>('/Workspaces/' + this.auth.workspace.id + '/Locations/' + remove.ID).delete();
  }

  removeCategory(toRemove: HierarchyItem) {
    // Remove from parent and promote children and items to parent
    this.afs.doc<HierarchyItem>('/Workspaces/' + this.auth.workspace.id + '/Category/' + toRemove.parent).get().pipe(
      map(doc => doc.data())
    ).toPromise().then(
      doc => {
        // Update parent's children
        let newChildren: string[] = (typeof doc.children === 'undefined' || doc.children === null) ? [] : doc.children;
        newChildren = newChildren.filter(obj => obj !== toRemove.ID);
        if (toRemove.children) {
          newChildren.concat(toRemove.children);
          // Update children's parents
          toRemove.children.forEach(child => this.afs.doc('Workspaces/' + this.auth.workspace.id + '/Category/' + child).update({parent: toRemove.parent}));
        }
        // Update parent's items
        const newItems: string[] = (typeof doc.items === 'undefined' || doc.items === null) ? [] : doc.items;
        if (toRemove.items) {
          toRemove.items.forEach(i => newItems.push(i));
          // Update item's parents
          toRemove.items.forEach(item => {
            this.searchService.getItem(item).subscribe(i => {
              // Set the category
              i.category = toRemove.parent;
              this.updateItem(i, null, null);
            });
          });
        }
        console.log(newItems);
        console.log(toRemove.items);
        this.afs.doc('Workspaces/' + this.auth.workspace.id + '/Category/' + toRemove.parent).update({
          children: newChildren,
          items: newItems
        });
      }
    );
    this.afs.doc<HierarchyItem>('/Workspaces/' + this.auth.workspace.id + '/Category/' + toRemove.ID).delete();
  }

  addCategory(newItem: HierarchyItem, newParentID: string) {
    newItem.ID = newItem.name + Math.round((Math.random() * 1000000));
    this.afs.doc<HierarchyItem>('/Workspaces/' + this.auth.workspace.id + '/Category/' + newItem.ID).set(newItem);
    this.afs.doc<HierarchyItem>('/Workspaces/' + this.auth.workspace.id + '/Category/' + newParentID).get().pipe(
      map(doc => doc.data())
    ).toPromise().then(
      doc => {
        const ary = (typeof doc.children === 'undefined' || doc.children === null) ? [] : doc.children;
        ary.push(newItem.ID);
        this.afs.doc('Workspaces/' + this.auth.workspace.id + '/Category/' + newParentID).update({children: ary});
      }
    );
  }

  updateCategoryPosition(parentID: string, moveID: string, oldParentID: string) {
    // update new parent id
    this.afs.doc<HierarchyItem>('/Workspaces/' + this.auth.workspace.id + '/Category/' + moveID).update({parent: parentID});
    // remove from old parent's child list
    this.afs.doc<HierarchyItem>('/Workspaces/' + this.auth.workspace.id + '/Category/' + oldParentID).get().pipe(
      map(doc => doc.data())
    ).toPromise().then(
      doc => {
        let ary: string[] = (typeof doc.children === 'undefined' || doc.children === null) ? [] : doc.children;
        // ary.remove(moveID);
        ary = ary.filter(obj => obj !== moveID);
        this.afs.doc('Workspaces/' + this.auth.workspace.id + '/Category/' + oldParentID).update({children: ary});
      }
    );
    // Add to new parent's list
    this.afs.doc<HierarchyItem>('/Workspaces/' + this.auth.workspace.id + '/Category/' + parentID).get().pipe(
      map(doc => doc.data())
    ).toPromise().then(
      doc => {
        const ary = (typeof doc.children === 'undefined' || doc.children === null) ? [] : doc.children;
        ary.push(moveID);
        this.afs.doc('Workspaces/' + this.auth.workspace.id + '/Category/' + parentID).update({children: ary});
      }
    );
  }

  updateHierarchy(node: HierarchyItem, isCategory: boolean) {
    const appropriateHierarchy = isCategory ? '/Category/' : '/Locations/';
    this.afs.doc<HierarchyItem>('/Workspaces/' + this.auth.workspace.id + appropriateHierarchy + node.ID).update(node);
  }

  /**
   * Gets all users from the current signed-in user's workspace
   */
  getWorkspaceUsers(): Observable<any[]>{
    try{
      //get all user metadata
      let users = this.afs.collection('/Users', ref => ref.where('workspace','==', this.auth.workspace.id)).snapshotChanges().pipe(map(a => {
        return a.map(g => {
        const data = g.payload.doc.data();
        const id = g.payload.doc.id;
        return {data:data, id:id};
        })
      }));
      //get all static user roles from db
      let wusers = this.afs.collection(`/Workspaces/${this.auth.workspace.id}/WorkspaceUsers/`).snapshotChanges().pipe(map(a => {
        return a.map(g => {
        const data = g.payload.doc.data();
        const id = g.payload.doc.id;
        return {data:data, id:id};
        })
      }));
      //filter and combine by user ID
      return combineLatest<any[]>(users, wusers, (user, wuser) =>{
        let list = []
        user.forEach((element, index) => {
          if(element)  list.push({user: element.data, role: wuser.find((elem) => elem.id === element.id).data.role});
        });
        return list;
      });
    }
    //error has occured
    catch(err){
      console.log(err)
    }
  }

  /**
   * Deletes a user from the DB and removes their metadata fields
   * @param email The email of the user to delete
   */
  deleteUserByEmail(email: string): Promise<string>{
    return new Promise((resolve, reject) => {
      //get ID token from auth state
      return this.auth.getAuth().subscribe(
        auth => {
          //check if logged in
          if(auth === null) reject('Auth token could not be retrieved. Perhaps you are logged out?');
          auth.getIdTokenResult().then(
            token => {
              //with token remove user by pinging server with token and email
              this.http.post(`${adServe}/removeUser`, {
                idToken: token,
                email: email
              }).toPromise().then(
                () => resolve(`Removed user ${email}`),
                (err) => reject(err.error)
              );
            }
          )
        }
      )
    })
  }

  /**
   * Sets a user's role in the DB
   * @param email The email of the user to update
   * @param role Role to update to, expects "Admin" or "User"
   */
  setUserRole(email: string, role: string){
    return new Promise((resolve, reject) => {
      //ensure correct role change given
      if(role === 'Admin' || role === 'User'){
        //get ID token from auth state
        return this.auth.getAuth().subscribe(
          auth => {
            //if auth is null, return
            if(auth === null) reject('Auth token could not be retrieved. Perhaps you are logged out?');
            //not null, try token
            auth.getIdTokenResult().then(
              token => {
                //with token set user role by pinging server with token, email, and role
                this.http.post(`${adServe}/setUserRole`, {
                  idToken: token,
                  email: email,
                  role: role
                }).toPromise().then(
                  () => resolve(role),
                  //error in posting
                  (err) => reject(err.error)
                );
              },
              //reject, error getting auth token
              (err) => reject(err)
            )
          }
        )
      } //not right role, reject
      else reject('Role not "Admin" or "User"');
    });
  }

  /**
   * Adds a user to the DB and populates their metadata fields
   * @param email the eamil of the user to add
   * @param firstName the first name of the user to add
   * @param lastName the last name of the user to add
   */
  async addUserToWorkspace(email: string, firstName: string, lastName: string): Promise<{user:User, role:string}>{
    return new Promise((resolve, reject) => {
      //get ID token from auth state
      this.auth.getAuth().subscribe(
        auth => {
          //if auth is null, reject
          if(auth === null) reject('Auth token could not be retrieved. Perhaps you are logged out?');
          //logged in, get goin'
          auth.getIdTokenResult().then(
            token => {
              //with token add user by pinging server with token and email
              this.http.post(`${adServe}/createNewUser`, {
                idToken: token,
                email: email,
                firstName: firstName,
                lastName: lastName
              }).toPromise().then(
                () => resolve({user:{firstName: firstName, lastName: lastName, email:email, workspace: this.auth.workspace.id}, role:'User'}),
                //error posting
                (err) => reject(err.error)
              );
          },
          //reject getIDToken
          (err) => reject(err)
          )
        }
      )
    });
  }

  constructor(private afs: AngularFirestore, private auth: AuthService, private searchService: SearchService, private http: HttpClient) {
  }
}
