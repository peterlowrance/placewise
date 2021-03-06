// import { AdminInterfaceService } from './admin-interface.service';

import {Injectable} from '@angular/core';
import {HttpHeaders, HttpClient, HttpResponse, HttpRequest} from '@angular/common/http';
import {Observable, of, Subscription} from 'rxjs';
import {Item} from '../models/Item';
import {AngularFirestore, DocumentReference, DocumentChangeAction} from '@angular/fire/firestore';
import {AuthService} from './auth.service';
import {SentReport} from '../models/SentReport';
import {map, first, finalize} from 'rxjs/operators';
import {HierarchyItem} from '../models/HierarchyItem';
import {SearchService} from './search.service';
import { combineLatest } from 'rxjs';
import { User } from '../models/User';
import * as firebase from 'firebase';
import { promise } from 'protractor';
import { Category } from '../models/Category';
import { HierarchyLocation } from '../models/Location';
import { type } from 'os';
import { WorkspaceUser } from '../models/WorkspaceUser';
import { CacheService } from './cache.service';
import { BinDictionary } from '../models/BinDictionary';

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
  private recentLocations: HierarchyLocation[]; // This helps the user not have to click so many buttons setting categories up
  getRecentCategories(): Category[] {return this.recentCategories};
  getRecentLocations(): HierarchyLocation[] {return this.recentLocations};

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

  placeReport(itemID: string, text: string, reportedTo: string[], locationID: string, type: string) {
    return new Promise((resolve, reject) => {
      this.auth.getAuth().subscribe(auth => {
        auth.getIdTokenResult().then(
          token => {
            // with token remove user by pinging server with token and email
            this.http.post(`${adServe}/createReport`, {
              idToken: token,
              item: itemID,
              location: locationID,
              message: text,
              reportTo: reportedTo,
              type: type
            }).toPromise().then(
              () => resolve(`Report sent!`),
              (err) => reject(err.error)
            );
          }
        );
      });
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

  setEmailReportsForUser(userID: string, value: boolean){
    this.afs.doc('Workspaces/' + this.auth.workspace.id + '/WorkspaceUsers/' + userID).set({emailReports: value}, {merge: true});
  }

  deleteReport(reportID: string, itemID: string) {
    // Try to remove the report from an item's data
    this.afs.doc<Item>('/Workspaces/' + this.auth.workspace.id + '/Items/' + itemID).get().toPromise().then(item => {
      let reports = (item.data() as Item).reports;

      // Look through connected reports and remove the data associated with the report's ID
      for(let index in reports){
        if(reports[index].report === reportID){
          reports.splice(Number(index), 1);
          //console.log("Deleted Report: " + reportID);

          this.afs.doc('/Workspaces/' + this.auth.workspace.id + '/Items/' + itemID).update({
            reports: reports
          });
          break;
        }
      }
    });

    // Delete actual report data
    this.afs.doc('/Workspaces/' + this.auth.workspace.id + '/Reports/' + reportID).delete();
  }

  /*
  clearReports(reports: SentReport[]) {
    for (let i = 0; i < reports.length; i++) {
      this.deleteReport(reports[i].ID);
    }
    return [];
  }
  */

  getListenedReportLocations(): Observable<string[]> {
    return new Observable(obs => {
      this.auth.getAuth().subscribe(authInfo => {
        this.afs.doc('Workspaces/' + this.auth.workspace.id + '/WorkspaceUsers/' + authInfo.uid).snapshotChanges().pipe(
          map(doc => {
            let data = doc.payload.data() as {role: string, listenedReportLocations: string[]}
            if(data.listenedReportLocations)
            obs.next(data.listenedReportLocations);
            else
            obs.next([]);
          })
        ).toPromise(); // This made it work, idk why
      })
    }); 
  }

  async setListenedReportLocations(locationIDs: string[]){
    this.auth.getAuth().subscribe(authInfo => {
      this.afs.doc('Workspaces/' + this.auth.workspace.id + '/WorkspaceUsers/' + authInfo.uid).update({listenedReportLocations: locationIDs});
    });
  }


  async updateItem(item: Item, oldCategoryID: string, oldLocationsID: string[]): Promise<boolean> {
    if(item.type) delete item.type;

    if (oldLocationsID) {
      // Remove from old locations - do this first so that the removed tracking data is saved when we update the item
      for(let i in oldLocationsID){
        // If this location is no longer present
        if (item.locations.indexOf(oldLocationsID[i]) === -1) {
          await this.afs.doc('Workspaces/' + this.auth.workspace.id + '/Locations/' + oldLocationsID[i]).update({items: firebase.firestore.FieldValue.arrayRemove(item.ID)});
          
          let binIDsToRemove: string[] = [];
          for(let locID in item.locationMetadata){ // Remove tracking data
            if(locID === oldLocationsID[i]){
              binIDsToRemove.push(item.locationMetadata[locID].binID);
              delete item.locationMetadata[locID];
            }
          }
          this.removeBinIDs(binIDsToRemove);
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

  updateItemDataFromCategoryAncestors(item: Item, categoryAndAncestors: Category[], oldCategory?: Category){
    let attributeSuffix = this.searchService.buildAttributeSuffixFrom(item, categoryAndAncestors);
    let category = categoryAndAncestors[0];

    // Setup additional text for auto title builder
    let returnData: any = this.getAdditionalTextFrom(category.prefix, attributeSuffix, item.name);
    returnData.attributeSuffix = attributeSuffix;

    // If there is no item name, build an automatic title.
    if(!item.name){
      item.name = (category.prefix ? category.prefix : "") + (attributeSuffix ? attributeSuffix : "");

      // If this resulted in a name, toggle on the Automatic Title Builder
      if(item.name){
        returnData.isAutoTitle = true;
      }
    }

    // If there is a category replacement, update item title
    else if(oldCategory) {
      // If this was using the auto prefix, replace it.
      if(oldCategory.prefix && item.name.startsWith(oldCategory.prefix)){
        item.name = item.name.substring(oldCategory.prefix.length);
        if(category.prefix){
          item.name = category.prefix + item.name;
        }
      }

      // If this was using the auto suffix, replace it.
      if (attributeSuffix && item.name.endsWith(attributeSuffix)) {
        item.name = item.name.substring(0, item.name.length - attributeSuffix.length).trim()
        if(category.titleFormat){
          item.name = item.name + this.searchService.buildAttributeSuffixFrom(item, categoryAndAncestors);
        }
      }
    }

    return returnData;
  }

  /** 
  * @return The additional text between the suffix and prefix. 
  * If it could not remove both, the auto title flag is set to false.
  */
   getAdditionalTextFrom(prefix: string, suffix: string, name: string): {additionalText: string, isAutoTitle: boolean} {
    // If there is no prefix or suffix, then there's no auto title
    if(!prefix && !suffix){
      return {additionalText: name, isAutoTitle: false};
    }

    let result = {additionalText: name, isAutoTitle: true};

    // Check for a prefix. If there is one, remove it. If that was not possible, uncheck auto title.
    if(prefix){
      if(name.startsWith(prefix)){
        result.additionalText = result.additionalText.substring(prefix.length).trim();
      }
      else {
        result.isAutoTitle = false;
      }
    }

    // Check for a suffix. If there is one, remove it. If that was not possible, uncheck auto title.
    if(suffix){
      if(name.endsWith(suffix)){
        result.additionalText = result.additionalText.substring(0, result.additionalText.length - suffix.length).trim();
      }
      else {
        if(result.isAutoTitle){
          result.isAutoTitle = false;
        }
        else {
          // If there was no prefix either, then there is no additional text
          result.additionalText = "";
        }
      }
    }

    return result;
  }

  createItem(item: Item): Observable<boolean> {
    this.afs.collection('/Workspaces/' + this.auth.workspace.id + '/Items').add({
      item
    });
    return of(true);
  }

  createItemAtLocation(item: Item): Observable<string> {

    return new Observable(obs => {
      this.afs.collection('/Workspaces/' + this.auth.workspace.id + '/Items').add(item).then(
        val => {
          obs.next(val.id);

          if(item.locations.length > 0){
            for(let location of item.locations){
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
          }

          this.afs.doc<HierarchyItem>('/Workspaces/' + this.auth.workspace.id + '/Category/' + item.category).get().pipe(
            map(doc => doc.data())
          ).toPromise().then(
            doc => {
              const ary = (typeof doc.items === 'undefined' || doc.items === null) ? [] : doc.items;
              ary.push(val.id);
              this.afs.doc('Workspaces/' + this.auth.workspace.id + '/Category/' + item.category).update({items: ary});
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
    
    this.cacheService.remove(item.ID, 'item');
    
    if (item.category) {
      this.afs.doc('Workspaces/' + this.auth.workspace.id + '/Category/' + item.category).update({items: firebase.firestore.FieldValue.arrayRemove(item.ID)});
    }
    if (item.locations && item.locations.length > 0) {
      item.locations.forEach(location => {
        // Remove bin IDs
        let binIDsToRemove: string[] = [];
        for(let locID in item.locationMetadata){
          if(locID === location){
            binIDsToRemove.push(item.locationMetadata[locID].binID);
          }
        }
        this.removeBinIDs(binIDsToRemove);

        this.afs.doc('Workspaces/' + this.auth.workspace.id + '/Locations/' + location).update({items: firebase.firestore.FieldValue.arrayRemove(item.ID)});
      });
    }
    
    var reports;

    this.getReports().subscribe(x => {
      reports = x;     
      for (let i = 0; i < reports.length; i++) {
        if(reports[i].item == item.ID)
        {
          this.deleteReport(reports[i].ID, item.ID);
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

  removeLocation(remove: HierarchyLocation): Promise<void> {
    // Remove from parent and promote children and items to parent
    this.afs.doc<HierarchyItem>('/Workspaces/' + this.auth.workspace.id + '/Locations/' + remove.parent).get().pipe(
      map(doc => doc.data())
    ).toPromise().then(
      doc => {
        // Update parent location's children to include locations within deleted location
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
        let newItems: string[] = (typeof doc.items === 'undefined' || doc.items === null) ? [] : doc.items;
        if (remove.items) {
          newItems = newItems.concat(remove.items);
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

        if(remove.shelfID){
          this.setShelfID(remove.ID, '000', remove.shelfID).subscribe(); // Delete shelf ID
        }
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
  getWorkspaceUsers(): Observable<WorkspaceUser[]> {
    
    return new Observable(obs => {

      var workspaceUsersSub: Subscription;
      var usersSub: Subscription;

      // First get the users within the User collection
      usersSub = this.afs.collection('/Users', ref => ref.where('workspace', '==', this.auth.workspace.id)).snapshotChanges().subscribe(rawUsers => {
        if(workspaceUsersSub){ // If there's already a subscription, reset it so that we don't make another
          workspaceUsersSub.unsubscribe();
        }

        // Then get the added WorkspaceUsers data
        workspaceUsersSub = this.afs.collection(`/Workspaces/${this.auth.workspace.id}/WorkspaceUsers/`).snapshotChanges().subscribe(rawWorkspaceUsers => {
          let workspaceUsers: WorkspaceUser[] = []; // To emit

          // Build the WorkspaceUsers using both sets of data
          rawWorkspaceUsers.forEach(wUser => {
            let workspaceUserDoc = wUser.payload.doc;
            for(let i = 0; i < rawUsers.length; i++){
              if(rawUsers[i].payload.doc.id === workspaceUserDoc.id){
                let userData = rawUsers[i].payload.doc.data() as User;
                let workspaceData = workspaceUserDoc.data() as {role: string, emailReports?: boolean}
                workspaceUsers.push({
                  id: workspaceUserDoc.id,
                  firstName: userData.firstName,
                  lastName: userData.lastName,
                  email: userData.email,
                  workspace: userData.workspace,
                  role: workspaceData.role,
                  emailReports: workspaceData.emailReports ? workspaceData.emailReports : false
                })
              }
            }
          })

          // Emit completed data
          obs.next(workspaceUsers);
        })
      })

      return {
        unsubscribe() {
          // Remove these from memory when unsubscribing
          workspaceUsersSub.unsubscribe();
          usersSub.unsubscribe();
        }
      }
    });

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
                  (err) => {
                    reject(err.error)
                    console.log(err);
                    console.log(email);
                  }
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
  async addUserToWorkspace(email: string, firstName: string, lastName: string): Promise<any> {
    return new Promise<void>((resolve, reject) => {
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
                () => resolve(), // Currently returns void
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

  updateDefaultReportUsers(userIDs: string[]){
    this.afs.doc('/Workspaces/' + this.auth.workspace.id).update({defaultUsersForReports: userIDs})
  }

  setShelfID(locationID: string, shelfID: string, previousShelfID?: string): Observable<string> {
    return new Observable(obs => {
      this.afs.doc('/Workspaces/' + this.auth.workspace.id + '/StructureData/BinDictionary').get().subscribe(doc => {
        if(doc.exists && doc.data().shelves){
          let data = doc.data() as BinDictionary;

          if(shelfID === '000'){
            obs.next('Zero is allowed, but will not be able to be referenced.'); // 0 shelf not allowed
           
            if(previousShelfID){
              delete data.shelves[previousShelfID];
              this.afs.doc('/Workspaces/' + this.auth.workspace.id + '/StructureData/BinDictionary').update({shelves: data.shelves});
            }
            obs.complete();
            return;
          }
  
          if(data.shelves[shelfID]){
            obs.next('ID is already taken'); // ID already exists
            obs.complete();
            return;
          }

          if(previousShelfID){
            delete data.shelves[previousShelfID];
          }
          data.shelves[shelfID] = locationID;
  
          this.afs.doc('/Workspaces/' + this.auth.workspace.id + '/StructureData/BinDictionary').update({shelves: data.shelves});
          obs.next('valid');
          obs.complete();
        }
        else {
          this.afs.doc('/Workspaces/' + this.auth.workspace.id + '/StructureData/BinDictionary').update({shelves: {[shelfID] : locationID}});
          obs.next('valid');
          obs.complete();
        }
      })
    })
  }

  /**
   * This is a straight foward method of adding the bin ID to the BinDictionary
   */
  addBinIDs(locationsData: {[locationID: string]: { ID: string, previousID: string}}, itemID: string) {
    this.afs.doc('/Workspaces/' + this.auth.workspace.id + '/StructureData/BinDictionary').get().subscribe(doc => {
      if(doc.exists && doc.data().bins){
        let data = doc.data() as BinDictionary;

        for(let locationID in locationsData){
          let locationData = locationsData[locationID];

          if(locationData.previousID){
            delete data.bins[locationData.previousID];
          }
          if(locationData.ID){
            data.bins[locationData.ID] = itemID;
          }
        }

        this.afs.doc('/Workspaces/' + this.auth.workspace.id + '/StructureData/BinDictionary').update({bins: data.bins});
      }
      else {
        let newBinDict: BinDictionary = {bins: {}, shelves: {}};

        for(let locationID in locationsData){
          let locationData = locationsData[locationID];

          newBinDict.bins[locationData.ID] = itemID;
        }

        this.afs.doc('/Workspaces/' + this.auth.workspace.id + '/StructureData/BinDictionary').update({bins: newBinDict.bins});
      }
    });
  }

  removeBinIDs(binIDs: string[]){
    this.afs.doc('/Workspaces/' + this.auth.workspace.id + '/StructureData/BinDictionary').get().subscribe(doc => {
      if(doc.exists && doc.data().bins){
        let data = doc.data() as BinDictionary;

        for(let binID of binIDs){
          delete data.bins[binID];
        }

        this.afs.doc('/Workspaces/' + this.auth.workspace.id + '/StructureData/BinDictionary').update({bins: data.bins});
      }
    });
  }

  /*
  async setBinID(locationID: string, itemID: string, binID: string): boolean {
    if(binID.startsWith('000')){
      return false; // 0 shelf not allowed
    }

    this.afs.doc('/Workspaces/' + this.auth.workspace.id + '/StructureData/BinDictionary').get().subscribe(doc => {
      if(doc.exists && doc.data().shelves){
        let data = doc.data() as BinDictionary;
        if(data.bins[binID]){
          return false;
        }
      }
      else {

      }
    });
  }*/

  constructor(
    private afs: AngularFirestore, 
    private auth: AuthService, 
    private searchService: SearchService, 
    private http: HttpClient,
    private cacheService: CacheService
    ) {
  }
}
