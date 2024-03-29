// import { AdminInterfaceService } from './admin-interface.service';

import {ComponentFactoryResolver, Injectable} from '@angular/core';
import {HttpHeaders, HttpClient, HttpResponse, HttpRequest} from '@angular/common/http';
import {Observable, of, range, Subscription} from 'rxjs';
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
import { Report } from '../models/Report';
import { ReportService, adServe } from './report.service';
import { HierarchyStructure } from '../models/HierarchyStructure';

declare var require: any;

const httpOptions = {
  headers: new HttpHeaders({
    'Content-Type': 'application/json'
  })
};


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

  setEmailReportsForUser(workspaceID: string, userID: string, value: boolean){
    this.afs.doc('Workspaces/' + workspaceID + '/WorkspaceUsers/' + userID).set({emailReports: value}, {merge: true});
  }

  deleteReport(workspaceID: string, reportID: string, itemID: string) {
    // Try to remove the report from an item's data
    this.afs.doc<Item>('/Workspaces/' + workspaceID + '/Items/' + itemID).get().toPromise().then(item => {
      let reports = (item.data() as Item).reports;

      // Look through connected reports and remove the data associated with the report's ID
      for(let index in reports){
        if(reports[index].report === reportID){
          reports.splice(Number(index), 1);
          //console.log("Deleted Report: " + reportID);

          this.afs.doc('/Workspaces/' + workspaceID + '/Items/' + itemID).update({
            reports: reports
          });
          break;
        }
      }
    });

    // Delete actual report data
    this.afs.doc('/Workspaces/' + workspaceID + '/Reports/' + reportID).delete();
  }

  /*
  clearReports(reports: SentReport[]) {
    for (let i = 0; i < reports.length; i++) {
      this.deleteReport(reports[i].ID);
    }
    return [];
  }
  */

  getListenedReportLocations(workspaceID: string): Observable<string[]> {
    return new Observable(obs => {
      this.auth.getAuth().subscribe(authInfo => {
        this.afs.doc('Workspaces/' + workspaceID + '/WorkspaceUsers/' + authInfo.uid).snapshotChanges().pipe(
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

  async setListenedReportLocations(workspaceID: string, locationIDs: string[]){
    this.auth.getAuth().subscribe(authInfo => {
      this.afs.doc('Workspaces/' + workspaceID + '/WorkspaceUsers/' + authInfo.uid).update({listenedReportLocations: locationIDs});
    });
  }


  async updateItem(workspaceID: string, item: Item, oldCategoryID: string, oldLocationsID: string[]): Promise<boolean> {
    if(item.type) delete item.type;

    if (oldLocationsID) {
      
      // Remove from old locations and delete internal bin data
      for(let i in oldLocationsID){
        // If this location is no longer present
        if (item.locations.indexOf(oldLocationsID[i]) === -1) {
          // Update the binIDs externally first
          this.removeBinIDs(workspaceID, item, [oldLocationsID[i]]);

          await this.afs.doc('Workspaces/' + workspaceID + '/Locations/' + oldLocationsID[i]).update({items: firebase.firestore.FieldValue.arrayRemove(item.ID)});
          
          for(let locID in item.locationMetadata){ // Remove tracking data
            if(locID === oldLocationsID[i]){
              delete item.locationMetadata[locID];
            }
          }
        }
      };

      // Add to new locations
      item.locations.forEach(async location => {
        await this.afs.doc('Workspaces/' + workspaceID + '/Locations/' + location).update({items: firebase.firestore.FieldValue.arrayUnion(item.ID)});
      });
    }

    await this.afs.doc<Item>('/Workspaces/' + workspaceID + '/Items/' + item.ID).set(item);

    if (oldCategoryID) {
      // Remove from old category
      await this.afs.doc('Workspaces/' + workspaceID + '/Category/' + oldCategoryID).update({items: firebase.firestore.FieldValue.arrayRemove(item.ID)});
      // Add to new category
      await this.afs.doc('Workspaces/' + workspaceID + '/Category/' + item.category).update({items: firebase.firestore.FieldValue.arrayUnion(item.ID)});
    }
    return true;
  }

  updateItemDataFromCategoryAncestors(workspaceID: string, item: Item, categoryAndAncestors: Category[], oldCategoryAndAncestors?: Category[]){
    let autoTitle = this.searchService.buildAttributeAutoTitleFrom(item, categoryAndAncestors);
    let category = categoryAndAncestors[0];

    // Setup additional text for auto title builder
    let returnData: any = {};
    returnData.autoTitle = autoTitle;

    // If there is no item name, build an automatic title.
    if(!item.name && autoTitle){
      item.name = autoTitle;
      returnData.isAutoTitle = true;
    }
    // If the item name started with the auto title, turn auto title on
    else if(item.name.startsWith(autoTitle)){
      returnData.additionalText = item.name.substring(autoTitle.length).trim();
      returnData.isAutoTitle = true;
    }

    // If there is a category replacement, update item title
    else if(item.name && oldCategoryAndAncestors) {
      let oldAutoTitle = this.searchService.buildAttributeAutoTitleFrom(item, oldCategoryAndAncestors);

      // If this was using the auto title, replace it.
      if(item.name.startsWith(oldAutoTitle)){
        item.name = autoTitle + item.name.substring(oldAutoTitle.length);
      }
    }

    return returnData;
  }

  createItem(workspaceID: string, item: Item): Observable<boolean> {
    this.afs.collection('/Workspaces/' + workspaceID + '/Items').add({
      item
    });
    return of(true);
  }

  createItemAtLocation(workspaceID: string, item: Item): Observable<string> {

    return new Observable(obs => {
      this.afs.collection('/Workspaces/' + workspaceID + '/Items').add(item).then(
        val => {
          obs.next(val.id);

          if(item.locations.length > 0){
            for(let location of item.locations){
              this.afs.doc<HierarchyItem>('/Workspaces/' + workspaceID + '/Locations/' + location).get().pipe(
                map(doc => doc.data())
              ).toPromise().then(
                doc => {
                  const ary = (typeof doc.items === 'undefined' || doc.items === null) ? [] : doc.items;
                  ary.push(val.id);
                  this.afs.doc('Workspaces/' + workspaceID + '/Locations/' + location).update({items: ary});
                }
              );
            }
          }

          this.afs.doc<HierarchyItem>('/Workspaces/' + workspaceID + '/Category/' + item.category).get().pipe(
            map(doc => doc.data())
          ).toPromise().then(
            doc => {
              const ary = (typeof doc.items === 'undefined' || doc.items === null) ? [] : doc.items;
              ary.push(val.id);
              this.afs.doc('Workspaces/' + workspaceID + '/Category/' + item.category).update({items: ary});
            }
          );

          obs.complete();
        }
      );
    });
    // return of(true);
  }

  removeItem(workspaceID: string, item: Item) {
    this.afs.doc<Item>('/Workspaces/' + workspaceID + '/Items/' + item.ID).delete();
    
    this.cacheService.remove(item.ID, 'item');
    
    if (item.category) {
      this.afs.doc('Workspaces/' + workspaceID + '/Category/' + item.category).update({items: firebase.firestore.FieldValue.arrayRemove(item.ID)});
    }
    if (item.locations && item.locations.length > 0) {
      this.removeBinIDs(workspaceID, item, item.locations);

      item.locations.forEach(location => {
        // Remove bin IDs
        let binIDsToRemove: {binID: string, rangeID: string}[] = [];
        for(let locID in item.locationMetadata){
          if(locID === location){
            binIDsToRemove.push({binID: item.locationMetadata[locID].binID, rangeID: item.locationMetadata[locID].binID});
          }
        }

        this.afs.doc('Workspaces/' + workspaceID + '/Locations/' + location).update({items: firebase.firestore.FieldValue.arrayRemove(item.ID)});
      });
    }
    
    var reports;

    this.reportService.getReports(workspaceID).subscribe(x => {
      reports = x;     
      for (let i = 0; i < reports.length; i++) {
        if(reports[i].item == item.ID)
        {
          this.deleteReport(workspaceID, reports[i].ID, item.ID);
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

  updateLocationPosition(workspaceID: string, parentID: string, moveID: string, oldParentID: string) {
    // update new parent id
    this.afs.doc<HierarchyItem>('/Workspaces/' + workspaceID + '/Locations/' + moveID).update({parent: parentID});
    // remove from old parent's child list
    this.afs.doc('Workspaces/' + workspaceID + '/Locations/' + oldParentID).update({children: firebase.firestore.FieldValue.arrayRemove(moveID)});
    // Add to new parent's list
    this.afs.doc('Workspaces/' + workspaceID + '/Locations/' + parentID).update({children: firebase.firestore.FieldValue.arrayUnion(moveID)});
  
    // QUICK REFERENCE DOC
    this.afs.doc<HierarchyStructure>('Workspaces/' + workspaceID + '/StructureData/LocationsHierarchy').ref.get().then(
      locationStructureData => {
        let structure = (locationStructureData.data() as HierarchyStructure);

        structure[moveID].parent = parentID;
        structure[oldParentID].children = structure[oldParentID].children.filter(child => child !== moveID);
        if(structure[parentID].children){
          structure[parentID].children.push(moveID);
        }
        else {
          structure[parentID].children = [moveID];
        }

        this.afs.doc<HierarchyStructure>('Workspaces/' + workspaceID + '/StructureData/LocationsHierarchy').update(structure);
      }
    )
  }

  // Originally "Add Location"
  setLocation(workspaceID: string, newItem: HierarchyItem, newParentID: string) {
    newItem.ID = newItem.name + Math.round((Math.random() * 1000000));
    this.afs.doc<HierarchyItem>('/Workspaces/' + workspaceID + '/Locations/' + newItem.ID).set(newItem);
    this.afs.doc<HierarchyItem>('/Workspaces/' + workspaceID + '/Locations/' + newParentID).get().pipe(
      map(doc => doc.data())
    ).toPromise().then(
      doc => {
        const ary = (typeof doc.children === 'undefined' || doc.children === null) ? [] : doc.children;
        ary.push(newItem.ID);
        this.afs.doc('Workspaces/' + workspaceID + '/Locations/' + newParentID).update({children: ary});
      }
    );
  }

  // New method for adding without generating our own ID and returning the new ID from firebase
  addLocation(workspaceID: string, newItem: HierarchyItem, newParentID: string): Observable<string> {
    return new Observable(obs => {
      this.afs.collection('/Workspaces/' + workspaceID + '/Locations').add(newItem).then(
        val => {
          this.afs.doc<HierarchyItem>('/Workspaces/' + workspaceID + '/Locations/' + newParentID).get().pipe(
            map(doc => doc.data())
          ).toPromise().then(
            doc => {
              const ary = (typeof doc.children === 'undefined' || doc.children === null) ? [] : doc.children;
              ary.push(val.id);
              this.afs.doc('Workspaces/' + workspaceID + '/Locations/' + newParentID).update({children: ary});
              obs.next(val.id);
              obs.complete();
          });

          this.afs.doc<HierarchyStructure>('/Workspaces/' + workspaceID + '/StructureData/LocationsHierarchy/').ref.get().then(
            locationStructureData => {
              let structure = (locationStructureData.data() as HierarchyStructure);


              structure[val.id] = {parent: newParentID};
              if(structure[newParentID].children){
                structure[newParentID].children.push(val.id);
              }
              else {
                structure[newParentID].children = [val.id];
              }

              this.afs.doc<HierarchyStructure>('Workspaces/' + workspaceID + '/StructureData/LocationsHierarchy').update(structure);
            }
          )
      });
    });
  }

  removeLocation(workspaceID: string, remove: HierarchyLocation): Promise<void> {
    // Remove from parent and promote children and items to parent
    this.afs.doc<HierarchyItem>('/Workspaces/' + workspaceID + '/Locations/' + remove.parent).get().pipe(
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
            this.afs.doc('Workspaces/' + workspaceID + '/Locations/' + remove.parent).update({children: newChildren});
          }
          remove.children.forEach(child => this.afs.doc('Workspaces/' + workspaceID + '/Locations/' + child).update({parent: remove.parent}));
        }
        // Update parent's items
        let newItems: string[] = (typeof doc.items === 'undefined' || doc.items === null) ? [] : doc.items;
        if (remove.items) {
          newItems = newItems.concat(remove.items);
          // Update item's parents
          remove.items.forEach(item => {
            this.searchService.getItem(workspaceID, item).subscribe(i => {
              // Remove the location from the items locations
              i.locations = i.locations.filter(id => id !== remove.ID);
              // Add the new parent to the items locations
              if (i.locations.indexOf(remove.parent) === -1) {
                i.locations.push(remove.parent);
              }
              this.updateItem(workspaceID, i, null, null);
            });
          });
        }
        this.afs.doc('Workspaces/' + workspaceID + '/Locations/' + remove.parent).update({children: newChildren, items: newItems});

        if(remove.shelfID){
          this.setShelfID(remove.ID, '000', remove.shelfID).subscribe(); // Delete shelf ID
        }
      }
    );

    this.afs.doc<HierarchyStructure>('/Workspaces/' + workspaceID + '/StructureData/LocationsHierarchy/').ref.get().then(
      locationStructureData => {
        let structure = (locationStructureData.data() as HierarchyStructure);

        delete structure[remove.ID];
        structure[remove.parent].children = structure[remove.parent].children.filter(child => child !== remove.ID);

        this.afs.doc<HierarchyStructure>('Workspaces/' + workspaceID + '/StructureData/LocationsHierarchy').update(structure);
      }
    )

    return this.afs.doc<HierarchyItem>('/Workspaces/' + workspaceID + '/Locations/' + remove.ID).delete();
  }

  removeCategory(workspaceID: string, toRemove: HierarchyItem): Promise<void> {
    // Remove from parent and promote children and items to parent
    this.afs.doc<HierarchyItem>('/Workspaces/' + workspaceID + '/Category/' + toRemove.parent).get().pipe(
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
            this.afs.doc('Workspaces/' + workspaceID + '/Category/' + toRemove.parent).update({children: newChildren});
          }
          // Update children's parents
          toRemove.children.forEach(child => this.afs.doc('Workspaces/' + workspaceID + '/Category/' + child).update({parent: toRemove.parent}));
        }
        // Update parent's items
        const newItems: string[] = (typeof doc.items === 'undefined' || doc.items === null) ? [] : doc.items;
        if (toRemove.items) {
          toRemove.items.forEach(i => newItems.push(i));
          // Update item's parents
          toRemove.items.forEach(item => {
            this.searchService.getItem(workspaceID, item).subscribe(i => {
              // Set the category
              i.category = toRemove.parent;
              this.updateItem(workspaceID, i, null, null);
            });
          });
        }
        this.afs.doc('Workspaces/' + workspaceID + '/Category/' + toRemove.parent).update({children: newChildren, items: newItems});
      }
    );

    this.afs.doc<HierarchyStructure>('/Workspaces/' + workspaceID + '/StructureData/CategoriesHierarchy/').ref.get().then(
      locationStructureData => {
        let structure = (locationStructureData.data() as HierarchyStructure);

        delete structure[toRemove.ID];
        structure[toRemove.parent].children = structure[toRemove.parent].children.filter(child => child !== toRemove.ID);

        this.afs.doc<HierarchyStructure>('Workspaces/' + workspaceID + '/StructureData/CategoriesHierarchy').update(structure);
      }
    )

    return this.afs.doc<HierarchyItem>('/Workspaces/' + workspaceID + '/Category/' + toRemove.ID).delete();
  }

  // Originally "Add Category"
  setCategory(workspaceID: string, newItem: HierarchyItem, newParentID: string) {
    newItem.ID = newItem.name + Math.round((Math.random() * 1000000));
    this.afs.doc<HierarchyItem>('/Workspaces/' + workspaceID + '/Category/' + newItem.ID).set(newItem);
    this.afs.doc<HierarchyItem>('/Workspaces/' + workspaceID + '/Category/' + newParentID).get().pipe(
      map(doc => doc.data())
    ).toPromise().then(
      doc => {
        const ary = (typeof doc.children === 'undefined' || doc.children === null) ? [] : doc.children;
        ary.push(newItem.ID);
        this.afs.doc('Workspaces/' + workspaceID + '/Category/' + newParentID).update({children: ary});
      }
    );
  }

  // New method for adding without generating our own ID and returning the new ID from firebase
  addCategory(workspaceID: string, newItem: HierarchyItem, newParentID: string): Observable<string> {
    return new Observable(obs => {
      this.afs.collection('/Workspaces/' + workspaceID + '/Category').add(newItem).then(
        val => {
          this.afs.doc<HierarchyItem>('/Workspaces/' + workspaceID + '/Category/' + newParentID).get().pipe(
            map(doc => doc.data())
          ).toPromise().then(
            doc => {
              const ary = (typeof doc.children === 'undefined' || doc.children === null) ? [] : doc.children;
              ary.push(val.id);
              this.afs.doc('Workspaces/' + workspaceID + '/Category/' + newParentID).update({children: ary});
              obs.next(val.id);
              obs.complete();
          });

          this.afs.doc<HierarchyStructure>('/Workspaces/' + workspaceID + '/StructureData/CategoriesHierarchy/').ref.get().then(
            categoryStructureData => {
              let structure = (categoryStructureData.data() as HierarchyStructure);


              structure[val.id] = {parent: newParentID};
              if(structure[newParentID].children){
                structure[newParentID].children.push(val.id);
              }
              else {
                structure[newParentID].children = [val.id];
              }

              this.afs.doc<HierarchyStructure>('Workspaces/' + workspaceID + '/StructureData/CategoriesHierarchy').update(structure);
            }
          )
      });
    });
  }

  updateCategoryPosition(workspaceID: string, parentID: string, moveID: string, oldParentID: string) {
    // update new parent id
    this.afs.doc<HierarchyItem>('/Workspaces/' + workspaceID + '/Category/' + moveID).update({parent: parentID});
    // remove from old parent's child list
    this.afs.doc('Workspaces/' + workspaceID + '/Category/' + oldParentID).update({children: firebase.firestore.FieldValue.arrayRemove(moveID)});
    // Add to new parent's list
    this.afs.doc('Workspaces/' + workspaceID + '/Category/' + parentID).update({children: firebase.firestore.FieldValue.arrayUnion(moveID)});

    // QUICK REFERENCE DOC
    this.afs.doc<HierarchyStructure>('Workspaces/' + workspaceID + '/StructureData/CategoriesHierarchy').ref.get().then(
      categoryStructureData => {
        let structure = (categoryStructureData.data() as HierarchyStructure);

        structure[moveID].parent = parentID;
        structure[oldParentID].children = structure[oldParentID].children.filter(child => child !== moveID);
        if(structure[parentID].children){
          structure[parentID].children.push(moveID);
        }
        else {
          structure[parentID].children = [moveID];
        }

        this.afs.doc<HierarchyStructure>('Workspaces/' + workspaceID + '/StructureData/CategoriesHierarchy').update(structure);
      }
    )
  }

  async updateHierarchy(workspaceID: string, node: HierarchyItem, isCategory: boolean): Promise<boolean> {
    if(node.type) delete node.type;
    const appropriateHierarchy = isCategory ? '/Category/' : '/Locations/';
    await this.afs.doc<HierarchyItem>('/Workspaces/' + workspaceID + appropriateHierarchy + node.ID).update(node);
    return true;
  }

  /**
   * Gets all users from the current signed-in user's workspace
   */
  getWorkspaceUsers(workspaceID: string): Observable<WorkspaceUser[]> {
    
    return new Observable(obs => {

      var workspaceUsersSub: Subscription;
      var usersSub: Subscription;

      // First get the users within the User collection
      usersSub = this.afs.collection('/Users', ref => ref.where('workspace', '==', workspaceID)).snapshotChanges().subscribe(rawUsers => {
        if(workspaceUsersSub){ // If there's already a subscription, reset it so that we don't make another
          workspaceUsersSub.unsubscribe();
        }

        // Then get the added WorkspaceUsers data
        workspaceUsersSub = this.afs.collection(`/Workspaces/${workspaceID}/WorkspaceUsers/`).snapshotChanges().subscribe(rawWorkspaceUsers => {
          // Correct for cache immediately loading only one user: Us.
          if(rawWorkspaceUsers.length === rawUsers.length){
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
          }
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

  updateDefaultReportUsers(workspaceID: string, userIDs: string[]){
    this.afs.doc('/Workspaces/' + workspaceID).update({defaultUsersForReports: userIDs})
  }

  setShelfID(workspaceID: string, locationID: string, shelfID: string, previousShelfID?: string): Observable<string> {
    return new Observable(obs => {
      this.afs.doc('/Workspaces/' + workspaceID + '/StructureData/BinDictionary').get().subscribe(doc => {
        if(doc.exists && doc.data().shelves){
          let data = doc.data() as BinDictionary;

          if(shelfID === '000'){
            obs.next('Zero is allowed, but will not be able to be referenced.'); // 0 shelf not allowed
           
            if(previousShelfID){
              delete data.shelves[previousShelfID];
              this.afs.doc('/Workspaces/' + workspaceID + '/StructureData/BinDictionary').update({shelves: data.shelves});
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
  
          this.afs.doc('/Workspaces/' + workspaceID + '/StructureData/BinDictionary').update({shelves: data.shelves});
          obs.next('valid');
          obs.complete();
        }
        else {
          this.afs.doc('/Workspaces/' + workspaceID + '/StructureData/BinDictionary').update({shelves: {[shelfID] : locationID}});
          obs.next('valid');
          obs.complete();
        }
      })
    })
  }

  /**
   * Manages updating bin IDs with or without ranges
   */
  setBinIDs(workspaceID: string, locationsData: {[locationID: string]: { ID: string, previousID?: string, range: string, previousRange?: string}}, itemID: string) {
    this.afs.doc('/Workspaces/' + workspaceID + '/StructureData/BinDictionary').get().subscribe(doc => {
      if(doc.exists && doc.data().bins){
        let data = doc.data() as BinDictionary;

        // This is for adding all the new ranges. It must be done after all delete loops so that if
        // there where overlapping changes, it doesn't delete a chunk of a new range
        let rangesToAdd: {shelfID: string, binStart: number, binStop: number}[] = [];

        for(let locationID in locationsData){
          let locationData = locationsData[locationID];
          console.log("PREVIOUS ID: " + locationData.previousID);

          // If we don't have range, just move the single ID
          if(!locationData.range && !locationData.previousRange){
            // Delete old
            if(locationData.previousID){
              delete data.bins[locationData.previousID];
            }
            // Add new
            if(locationData.ID){
              data.bins[locationData.ID] = itemID;
            }
          }
          else {

            // In tests, I found the delete function to basically be O(1), mostly when deleting only a few elements from a large array.
            // So for simplicity's sake, just delete the old range and add the new one.

            // ??? Maybe good still ???
            // Fill in missing data for range calculations
            // Otherwise this code would get another degree of complicated
            if(!locationData.range){
              locationData.range = locationData.ID;
            }
            if(!locationData.previousRange){
              locationData.previousRange = locationData.range;
            }
            if(!locationData.previousID){
              locationData.previousID = locationData.ID;
            }

            // Convert ranges into countable for loops
            let binDeleteStart = Number.parseInt(locationData.previousID.split('-')[1]);
            let binDeleteEnd = Number.parseInt(locationData.previousRange.split('-')[1]);
            let shelfID = locationData.previousID.split('-')[0];

            if(binDeleteEnd < binDeleteStart){ // For odd cases when we are completely changing things
              binDeleteEnd = binDeleteStart;   // For example: going from point 009 to range 004 to 006
            }                                  // So set the end to 009 for deleting, not 006

            // Remove
            for(let binNum = binDeleteStart; binNum <= binDeleteEnd; binNum ++){
              if(binNum < 10) { 
                delete data.bins[shelfID + '-00' + binNum]; 
              }
              else if(binNum < 100) { 
                delete data.bins[shelfID + '-0' + binNum]; 
              }
              else { 
                delete data.bins[shelfID + '-' + binNum]; 
              }
            }

            // Make sure we're adding and not jsut deleting everything
            if(locationData.ID){
              // Add to the array for setting up all ranges later
              let binStart = Number.parseInt(locationData.ID.split('-')[1]);
              let binStop = Number.parseInt(locationData.range.split('-')[1]);

              rangesToAdd.push({shelfID, binStart, binStop});
            }
          }
        }

        // Add new/changed ranges
        for(let rangeData of rangesToAdd){
          for(let binNum = rangeData.binStart; binNum <= rangeData.binStop; binNum++){
            if(binNum < 10)  { 
              data.bins[rangeData.shelfID + '-00' + binNum] = itemID;
            }
            else if(binNum < 100)  { 
              data.bins[rangeData.shelfID + '-0' + binNum] = itemID;
            }
            else  { 
              data.bins[rangeData.shelfID + '-' + binNum] = itemID; 
            }
          }
        }

        this.afs.doc('/Workspaces/' + workspaceID + '/StructureData/BinDictionary').update({bins: data.bins});
      }
      else {
        let newBinDict: BinDictionary = {bins: {}, shelves: {}};

        for(let locationID in locationsData){
          let locationData = locationsData[locationID];

          if(locationData.range){
            let binNum = Number.parseInt(locationData.previousRange.split('-')[1]);
            let rangeNum = Number.parseInt(locationData.range.split('-')[1]);
            let shelfID = locationData.ID.split('-')[0];
            let binAsThreeDigits;

            for(let binID = binNum; binID <= rangeNum; binID++){
              if(binNum < 10)  { binAsThreeDigits = "00" + binNum; }
              else if(binNum < 100)  { binAsThreeDigits = "0" + binNum; }
              else  { binAsThreeDigits = binNum }

              newBinDict.bins[shelfID + '-' + binAsThreeDigits] = itemID;
            }
          }
          else {
            newBinDict.bins[locationData.ID] = itemID;
          }
        }

        this.afs.doc('/Workspaces/' + workspaceID + '/StructureData/BinDictionary').update({bins: newBinDict.bins});
      }
    });
  }

  removeBinIDs(workspaceID: string, item: Item, locationsToRemoveFrom: string[]){
    let binsToReset: {[locationID: string]: { ID: string, previousID?: string, range: string, previousRange?: string}} = {};

    for(let locationID of locationsToRemoveFrom){
      if(item.locationMetadata[locationID] && item.locationMetadata[locationID].binID){
        binsToReset[locationID] = {
          ID: null,
          range: null,
          previousID: item.locationMetadata[locationID].binID,
          previousRange: item.locationMetadata[locationID].binIDRange
        }
      }
    }

    this.setBinIDs(workspaceID, binsToReset, item.ID);
  }

  /*
  hack(){
    this.afs.collection('Workspaces/Apex Fab/Category').get().subscribe(hier => {
      let structure = {};

      hier.forEach(doc => {
        let data = doc.data();
        if(data){
					if(data.children){
						if(!structure[doc.id]){
              structure[doc.id] = {children: data.children};
            }
            else {
              structure[doc.id].children = data.children;
            }
					}
          
					if(data.parent){
						if(!structure[doc.id]){
              structure[doc.id] = {parent: data.parent};
            }
            else {
              structure[doc.id].parent = data.parent;
            }
					}
        }
      })

      this.afs.doc('Workspaces/Apex Fab/StructureData/CategoriesHierarchy').set(structure);
    })
  }
  */

  constructor(
    private afs: AngularFirestore, 
    private auth: AuthService, 
    private searchService: SearchService, 
    private http: HttpClient,
    private cacheService: CacheService,
    private reportService: ReportService
    ) {
  }
}
