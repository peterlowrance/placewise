// import { AdminInterfaceService } from './admin-interface.service';

import {Injectable} from '@angular/core';
import {HttpHeaders, HttpClient, HttpResponse, HttpRequest} from '@angular/common/http';
import {Observable, of} from 'rxjs';
import {Item} from '../models/Item';
import {AngularFirestore, DocumentReference} from '@angular/fire/firestore';
import {AuthService} from './auth.service';
import {SentReport} from '../models/SentReport';
import {map} from 'rxjs/operators';
import {HierarchyItem} from '../models/HierarchyItem';
import {SearchService} from './search.service';
import { combineLatest } from 'rxjs';
import { User } from '../models/User';
import * as firebase from 'firebase';
import { promise } from 'protractor';
import { Category } from '../models/Category';
import { Location } from '../models/Location';
import { type } from 'os';

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

  private recentCategories: Category[]; // This helps the user not have to click so many buttons setting categories up
  private recentLocations: Location[]; // This helps the user not have to click so many buttons setting categories up
  getRecentCategories(): Category[] {return this.recentCategories};
  getRecentLocations(): Location[] {return this.recentLocations};

  addToRecent(recent: HierarchyItem){
    if(recent.ID === 'root') return; // Roots should not be saved

    // Load which array we'll be saving to
    let recentList: HierarchyItem[];
    if(recent.type === 'category'){
      if(!this.recentCategories) this.recentCategories = [];
      recentList = this.recentCategories;
    }
    else if(recent.type === 'location') {
      if(!this.recentLocations) this.recentLocations = [];
      recentList = this.recentLocations;
    }
    else {
      return; // Not a category or location
    }

    let found = false;

    // Add to recent or reorder the list to being the most recent if it already exists
    for(let listIndex in recentList){ 
      if(recentList[listIndex].ID === recent.ID){
        found = true;
        let foundIndex = parseInt(listIndex);
        if(foundIndex != 0){
          recentList.splice(foundIndex, 1);
          recentList.splice(0, 0, recent)
        }
        break;
      }
    }
    if(!found) recentList.splice(0, 0, recent);
    if(recentList.length > 8){ // Only have 5
      recentList.pop();
    }
  }


  getReport(id: string) {
    return this.afs.doc<SentReport>('/Workspaces/' + this.auth.workspace.id + '/Reports/' + id).snapshotChanges().pipe(map(a => {
      const data = a.payload.data() as SentReport;
      if (!data) {
        return;
      }
      data.ID = a.payload.id;
      return data;
    }));
  }
  placeReport(itemID: string, text: string) {
    let userID: string;
    let rID: string;
    this.auth.getAuth().subscribe(x => this.placeReportHelper(itemID, text, x.uid).then(x => rID = x.id));
    return of(true);
  }

  placeReportHelper(itemID: string, text: string, userID: string): Promise<DocumentReference> {
    return this.afs.collection('/Workspaces/' + this.auth.workspace.id + '/Reports').add({
      desc: text,
      item: itemID,
      user: userID,
      date: new Date()
    });
  }

  getReports(): Observable<SentReport[]> {
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

  clearReports(reports: SentReport[]) {
    for (let i = 0; i < reports.length; i++) {
      this.deleteReport(reports[i].ID);
    }
    return [];
  }


  async updateItem(item: Item, oldCategoryID: string, oldLocationsID: string[]): Promise<boolean> {
    if(item.type) delete item.type;

    if (oldLocationsID) {
      // Remove from old locations - do this first so that the removed tracking data is saved when we update the item
      for(let i in oldLocationsID){
        // If this location is no longer present
        if (item.locations.indexOf(oldLocationsID[i]) === -1) {
          await this.afs.doc('Workspaces/' + this.auth.workspace.id + '/Locations/' + oldLocationsID[i]).update({items: firebase.firestore.FieldValue.arrayRemove(item.ID)});
          
          for(let index in item.tracking){ // Remove tracking data
            if(item.tracking[index].locationID === oldLocationsID[i]){
              item.tracking.splice(parseInt(index), 1);
            }
          }
        }
      };
      // Add to new locations
      item.locations.forEach(async location => {
        await this.afs.doc('Workspaces/' + this.auth.workspace.id + '/Locations/' + location).update({items: firebase.firestore.FieldValue.arrayUnion(item.ID)});
      });
    }

    await this.afs.doc<Item>('/Workspaces/' + this.auth.workspace.id + '/Items/' + item.ID).set(item);

    if (oldCategoryID) {
      // Remove from old category
      await this.afs.doc('Workspaces/' + this.auth.workspace.id + '/Category/' + oldCategoryID).update({items: firebase.firestore.FieldValue.arrayRemove(item.ID)});
      // Add to new category
      await this.afs.doc('Workspaces/' + this.auth.workspace.id + '/Category/' + item.category).update({items: firebase.firestore.FieldValue.arrayUnion(item.ID)});
    }
    return true;
  }

  createItem(item: Item): Observable<boolean> {
    this.afs.collection('/Workspaces/' + this.auth.workspace.id + '/Items').add({
      item
    });
    return of(true);
  }

  createItemAtLocation(name: string, desc: string, tags: string[], category: string, imageUrl: string, location: string): Observable<string> {
    if (!category) {
      category = 'root';
    }

    return new Observable(obs => {
      this.afs.collection('/Workspaces/' + this.auth.workspace.id + '/Items').add({name, fullTitle: name, desc, tags, locations: location ? [location] : [], category, imageUrl
      }).then(
        val => {
          obs.next(val.id);

          if(location){
            this.afs.doc<HierarchyItem>('/Workspaces/' + this.auth.workspace.id + '/Locations/' + location).get().pipe(
              map(doc => doc.data())
            ).toPromise().then(
              doc => {
                const ary = (typeof doc.items === 'undefined' || doc.items === null) ? [] : doc.items;
                ary.push(val.id);
                this.afs.doc('Workspaces/' + this.auth.workspace.id + '/Locations/' + location).update({items: ary});
              }
            );
          }

          this.afs.doc<HierarchyItem>('/Workspaces/' + this.auth.workspace.id + '/Category/' + category).get().pipe(
            map(doc => doc.data())
          ).toPromise().then(
            doc => {
              const ary = (typeof doc.items === 'undefined' || doc.items === null) ? [] : doc.items;
              ary.push(val.id);
              this.afs.doc('Workspaces/' + this.auth.workspace.id + '/Category/' + category).update({items: ary});
            }
          );

          obs.complete();
        }
      );
    });
    // return of(true);
  }

  removeItem(item: Item) {
    this.afs.doc<Item>('/Workspaces/' + this.auth.workspace.id + '/Items/' + item.ID).delete();
    if (item.category) {
      this.afs.doc('Workspaces/' + this.auth.workspace.id + '/Category/' + item.category).update({items: firebase.firestore.FieldValue.arrayRemove(item.ID)});
    }
    if (item.locations && item.locations.length > 0) {
      item.locations.forEach(location => {
        this.afs.doc('Workspaces/' + this.auth.workspace.id + '/Locations/' + location).update({items: firebase.firestore.FieldValue.arrayRemove(item.ID)});
      });
    }
    
    var reports;

    this.getReports().subscribe(x => {
      reports = x;     
      for (let i = 0; i < reports.length; i++) {
        if(reports[i].item == item.ID)
        {
          this.deleteReport(reports[i].ID);
        }
      }
    }
    )

    return of(true);
  }

  removeAttribute(category: Category, id: string){
    
  }

  updateHierarchyPosition(parentID: number, moveID: number) {
    throw new Error('Method not implemented.');
  }

  updateLocationPosition(parentID: string, moveID: string, oldParentID: string) {
    // update new parent id
    this.afs.doc<HierarchyItem>('/Workspaces/' + this.auth.workspace.id + '/Locations/' + moveID).update({parent: parentID});
    // remove from old parent's child list
    this.afs.doc('Workspaces/' + this.auth.workspace.id + '/Locations/' + oldParentID).update({children: firebase.firestore.FieldValue.arrayRemove(moveID)});
    // Add to new parent's list
    this.afs.doc('Workspaces/' + this.auth.workspace.id + '/Locations/' + parentID).update({children: firebase.firestore.FieldValue.arrayUnion(moveID)});
  }

  // Originally "Add Location"
  setLocation(newItem: HierarchyItem, newParentID: string) {
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

  // New method for adding without generating our own ID and returning the new ID from firebase
  addLocation(newItem: HierarchyItem, newParentID: string): Observable<string> {
    return new Observable(obs => {
      this.afs.collection('/Workspaces/' + this.auth.workspace.id + '/Locations').add(newItem).then(
        val => {
          this.afs.doc<HierarchyItem>('/Workspaces/' + this.auth.workspace.id + '/Locations/' + newParentID).get().pipe(
            map(doc => doc.data())
          ).toPromise().then(
            doc => {
              const ary = (typeof doc.children === 'undefined' || doc.children === null) ? [] : doc.children;
              ary.push(val.id);
              this.afs.doc('Workspaces/' + this.auth.workspace.id + '/Locations/' + newParentID).update({children: ary});
              obs.next(val.id);
              obs.complete();
        });
      });
    });
  }

  removeLocation(remove: HierarchyItem): Promise<void> {
    // Remove from parent and promote children and items to parent
    this.afs.doc<HierarchyItem>('/Workspaces/' + this.auth.workspace.id + '/Locations/' + remove.parent).get().pipe(
      map(doc => doc.data())
    ).toPromise().then(
      doc => {
        // Update parent's children
        let newChildren: string[] = (typeof doc.children === 'undefined' || doc.children === null) ? [] : doc.children;
        newChildren = newChildren.filter(obj => obj !== remove.ID);
        if (remove.children) {
          newChildren = newChildren.concat(remove.children);
          // Update children's parents
          if (remove.parent) {
            this.afs.doc('Workspaces/' + this.auth.workspace.id + '/Locations/' + remove.parent).update({children: newChildren});
          }
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
              this.updateItem(i, null, null);
            });
          });
        }
        this.afs.doc('Workspaces/' + this.auth.workspace.id + '/Locations/' + remove.parent).update({children: newChildren, items: newItems});
      }
    );
    return this.afs.doc<HierarchyItem>('/Workspaces/' + this.auth.workspace.id + '/Locations/' + remove.ID).delete();
  }

  removeCategory(toRemove: HierarchyItem): Promise<void> {
    // Remove from parent and promote children and items to parent
    this.afs.doc<HierarchyItem>('/Workspaces/' + this.auth.workspace.id + '/Category/' + toRemove.parent).get().pipe(
      map(doc => doc.data())
    ).toPromise().then(
      doc => {
        // Update parent's children
        let newChildren: string[] = (typeof doc.children === 'undefined' || doc.children === null) ? [] : doc.children;
        newChildren = newChildren.filter(obj => obj !== toRemove.ID);
        if (toRemove.children) {
          newChildren = newChildren.concat(toRemove.children);
          // Update parent's children
          if (toRemove.parent) {
            this.afs.doc('Workspaces/' + this.auth.workspace.id + '/Category/' + toRemove.parent).update({children: newChildren});
          }
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
        this.afs.doc('Workspaces/' + this.auth.workspace.id + '/Category/' + toRemove.parent).update({children: newChildren, items: newItems});
      }
    );
    return this.afs.doc<HierarchyItem>('/Workspaces/' + this.auth.workspace.id + '/Category/' + toRemove.ID).delete();
  }

  // Originally "Add Category"
  setCategory(newItem: HierarchyItem, newParentID: string) {
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

  // New method for adding without generating our own ID and returning the new ID from firebase
  addCategory(newItem: HierarchyItem, newParentID: string): Observable<string> {
    return new Observable(obs => {
      this.afs.collection('/Workspaces/' + this.auth.workspace.id + '/Category').add(newItem).then(
        val => {
          this.afs.doc<HierarchyItem>('/Workspaces/' + this.auth.workspace.id + '/Category/' + newParentID).get().pipe(
            map(doc => doc.data())
          ).toPromise().then(
            doc => {
              const ary = (typeof doc.children === 'undefined' || doc.children === null) ? [] : doc.children;
              ary.push(val.id);
              this.afs.doc('Workspaces/' + this.auth.workspace.id + '/Category/' + newParentID).update({children: ary});
              obs.next(val.id);
              obs.complete();
        });
      });
    });
  }

  updateCategoryPosition(parentID: string, moveID: string, oldParentID: string) {
    // update new parent id
    this.afs.doc<HierarchyItem>('/Workspaces/' + this.auth.workspace.id + '/Category/' + moveID).update({parent: parentID});
    // remove from old parent's child list
    this.afs.doc('Workspaces/' + this.auth.workspace.id + '/Category/' + oldParentID).update({children: firebase.firestore.FieldValue.arrayRemove(moveID)});
    // Add to new parent's list
    this.afs.doc('Workspaces/' + this.auth.workspace.id + '/Category/' + parentID).update({children: firebase.firestore.FieldValue.arrayUnion(moveID)});
  }

  async updateHierarchy(node: HierarchyItem, isCategory: boolean): Promise<boolean> {
    if(node.type) delete node.type;
    const appropriateHierarchy = isCategory ? '/Category/' : '/Locations/';
    await this.afs.doc<HierarchyItem>('/Workspaces/' + this.auth.workspace.id + appropriateHierarchy + node.ID).update(node);
    return true;
  }

  /**
   * Gets all users from the current signed-in user's workspace
   */
  getWorkspaceUsers(): Observable<any[]> {
    try {
      // get all user metadata
      const users = this.afs.collection('/Users', ref => ref.where('workspace', '==', this.auth.workspace.id)).snapshotChanges().pipe(map(a => {
        return a.map(g => {
        const data = g.payload.doc.data();
        const id = g.payload.doc.id;
        return {data, id};
        });
      }));
      // get all static user roles from db
      const wusers = this.afs.collection(`/Workspaces/${this.auth.workspace.id}/WorkspaceUsers/`).snapshotChanges().pipe(map(a => {
        return a.map(g => {
        const data = g.payload.doc.data();
        const id = g.payload.doc.id;
        return {data, id};
        });
      }));
      // filter and combine by user ID
      return combineLatest<any[]>(users, wusers, (user, wuser) => {
        const list = [];
        user.forEach((element, index) => {
          if (element && element.data) {  list.push({user: element.data, role: wuser.find((elem) => elem.id === element.id && elem.data).data.role}); }
        });
        return list;
      });
    } catch (err) {
      console.log(err);
    }
  }

  /**
   * Deletes a user from the DB and removes their metadata fields
   * @param email The email of the user to delete
   */
  deleteUserByEmail(email: string): Promise<string> {
    return new Promise((resolve, reject) => {
      // get ID token from auth state
      return this.auth.getAuth().subscribe(
        auth => {
          // check if logged in
          if (auth === null) { reject('Auth token could not be retrieved. Perhaps you are logged out?'); }
          auth.getIdTokenResult().then(
            token => {
              // with token remove user by pinging server with token and email
              this.http.post(`${adServe}/removeUser`, {
                idToken: token,
                email
              }).toPromise().then(
                () => resolve(`Removed user ${email}`),
                (err) => reject(err.error)
              );
            }
          );
        }
      );
    });
  }

  /**
   * Sets a user's role in the DB
   * @param email The email of the user to update
   * @param role Role to update to, expects "Admin" or "User"
   */
  setUserRole(email: string, role: string) {
    return new Promise((resolve, reject) => {
      // ensure correct role change given
      if (role === 'Admin' || role === 'User') {
        // get ID token from auth state
        return this.auth.getAuth().subscribe(
          auth => {
            // if auth is null, return
            if (auth === null) { reject('Auth token could not be retrieved. Perhaps you are logged out?'); }
            // not null, try token
            auth.getIdTokenResult().then(
              token => {
                // with token set user role by pinging server with token, email, and role
                this.http.post(`${adServe}/setUserRole`, { idToken: token, email, role
                }).toPromise().then(
                  () => resolve(role),
                  // error in posting
                  (err) => reject(err.error)
                );
              },
              // reject, error getting auth token
              (err) => reject(err)
            );
          }
        );
      } else { reject('Role not "Admin" or "User"'); }
    });
  }

  /**
   * Adds a user to the DB and populates their metadata fields
   * @param email the eamil of the user to add
   * @param firstName the first name of the user to add
   * @param lastName the last name of the user to add
   */
  async addUserToWorkspace(email: string, firstName: string, lastName: string): Promise<{user: User, role: string}> {
    return new Promise((resolve, reject) => {
      // get ID token from auth state
      this.auth.getAuth().subscribe(
        auth => {
          // if auth is null, reject
          if (auth === null) { reject('Auth token could not be retrieved. Perhaps you are logged out?'); }
          // logged in, get goin'
          auth.getIdTokenResult().then(
            token => {
              // with token add user by pinging server with token and email
              this.http.post(`${adServe}/createNewUser`, {idToken: token, email, firstName, lastName
              }).toPromise().then(
                () => resolve({user: {firstName, lastName, email, workspace: this.auth.workspace.id}, role: 'User'}),
                // error posting
                (err) => reject(err.error)
              );
          },
          // reject getIDToken
          (err) => reject(err)
          );
        }
      );
    });
  }

  async updateTracking(locationID: string, itemID: string, type: string, value: any): Promise<string> {
    return new Promise((resolve, reject) => {
      this.auth.getAuth().subscribe(
        auth => {
          // if auth is null, reject
          if (auth === null) { reject('Auth token could not be retrieved. Perhaps you are logged out?'); }
          // logged in, get goin'
          auth.getIdTokenResult().then(
            token => {
              this.http.post(`${adServe}/updateTracking`, {idToken: token, locationID, itemID, type, valueToSet: value}).toPromise().then(
                () => resolve("Update confirmed!"),
                (err) => reject(err)
              );
            })
          })
    })
  }

  constructor(private afs: AngularFirestore, private auth: AuthService, private searchService: SearchService, private http: HttpClient) {
  }
}
