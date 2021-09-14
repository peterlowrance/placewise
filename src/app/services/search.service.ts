import {SearchInterfaceService} from './search-interface.service';

import {Injectable} from '@angular/core';
import {HttpHeaders} from '@angular/common/http';
import {Observable, of, observable, Subscription} from 'rxjs';

import {Item} from '../models/Item';
import {HierarchyItem} from '../models/HierarchyItem';
import {AngularFirestore} from '@angular/fire/firestore';
import {map, first} from 'rxjs/operators';
import {AuthService} from './auth.service';
import {ImageService} from './image.service';
import { HierarchyObject } from '../models/HierarchyObject';
import { Category } from '../models/Category';
import { HierarchyLocation } from '../models/Location';
import { ContentObserver } from '@angular/cdk/observers';
import { CacheService } from './cache.service';
import { time } from 'console';
import { BinDictionary } from '../models/BinDictionary';
import { WorkspaceInfo } from '../models/WorkspaceInfo';

const httpOptions = {
  headers: new HttpHeaders({
    'Content-Type': 'application/json'
  })
};

@Injectable({
  providedIn: 'root'
})

export class SearchService implements SearchInterfaceService {

  locations: HierarchyItem[];
  categories: Category[];

  // /**
  //  * Finds all the ancestors of an item and returns them in a 2D array.
  //  * The first dimension of the array are arrays of ancestors, the second dimension is each individual ancestor.
  //  * @param id item to find ancestors of
  //  */
  // getAncestorsOfItem(id: string): Observable<HierarchyItem[][]> {
  //   return new Observable(obs => {
  //     this.getAllLocations().subscribe(locs => {
  //       obs.next(this.getAncestors(id, locs));
  //       obs.complete();
  //     });
  //   });
  // }

  /**
   * Returns the ancestors from IDs of whichever type you are searching by.
   * @param parents the parent or parents of what something is located in
   * @param locations array of hierarchy items to find ancestors out of
   */
  getAncestors(parentIDs: string[], hierItems: HierarchyItem[]): HierarchyItem[][] {
    const result: HierarchyItem[][] = [];
    // Find all parents of items and add an array for each parent
    for(const parentID of parentIDs){
      for(const firstParent of hierItems) {
        if (firstParent.ID === parentID) {
          const ancestors: HierarchyItem[] = [firstParent];
          result.push(ancestors);
          // Find all parents in this ancestor list
          // While the last parent of the last array of ancestors is not the root
          while (result[result.length - 1][result[result.length - 1].length - 1].ID !== 'root') {
            let not_found_error = true; // Prevent infinite loop

            for (const nextParent of hierItems) {
              // If the item has the same ID as the parent of the last item in the ancestor list, add it
              if (nextParent.ID === result[result.length - 1][result[result.length - 1].length - 1].parent) {
                result[result.length - 1].push(nextParent);
                not_found_error = false;
                break;
              }
            }

            if(not_found_error){
              console.log("ERROR! Categories improperly loaded.");
              console.log(result[result.length - 1][result[result.length - 1].length - 1].ID);
              // NOTE: this has popped up with a location ID before!
              break;
            }
          }
        }
      }
    }
    
    return result;
  }

  /**
   * A general ancestor call for any type of thing in a hierarchy (item, category, location)
   * The first dimension of the array are arrays of ancestors (multiple when getting mutliple locations from an item),
   * The second dimension is each individual ancestor.
   * @param id item to find ancestors of
   */
  getAncestorsOf(workspaceID: string, item: HierarchyObject): Observable<HierarchyItem[][]> {
    
    return new Observable(obs => {
    if(item.type === "item"){
        this.getAllLocations(workspaceID).subscribe(locs => {
          obs.next(this.getAncestors((item as Item).locations, locs));
          obs.complete();
        });
    }
    else {
        let hierItem = item as HierarchyItem;
        if(hierItem.type === 'category'){
          this.getAllCategories(workspaceID).subscribe(categories =>
            {
              console.log("RECV ALL CATS");
              obs.next(this.getAncestors([hierItem.parent], categories));

              if(categories.length > 1){  // Finish when we have all the data (It always has at least a length of one ??)
                obs.complete();
              }
            })
        } else {
          this.getAllLocations(workspaceID).subscribe(locations =>
            {
              console.log("RECV ALL LOCS");
              obs.next(this.getAncestors([hierItem.parent], locations));
              
              if(locations.length > 1){  // Finish when we have all the data (It always has at least a length of one ??)
                obs.complete();
              }
            })
        }
      }
    });
  }

  // TESTING METHOD
  // INCLUDES PARENT
  getAncestorsByChain(workspaceID: string, ID: string, type: string): Promise<HierarchyItem[]> {
    return new Promise<HierarchyItem[]>( async resolve => {
      let results: HierarchyItem[] = [];
      let nextID = ID;
      let finished = false;
      let typeURL = type === 'category' ? 'Category' : 'Locations';

      while(!finished){
        let location = (await this.afs.doc('/Workspaces/' + workspaceID + '/' + typeURL + '/' + nextID).get().toPromise()).data() as HierarchyLocation;
        location.ID = nextID;
        results.push(location);
        
        if(location.parent){
          nextID = location.parent;
        }
        else {
          finished = true;
        }
      }

      resolve(results);
    })
  }

  getShelfIDFromAncestors(workspaceID: string, locationID: string): Promise<string>{
    return new Promise<string>( async resolve => {
      let shelfID: string;
      let nextID = locationID;

      while(!shelfID){
        let location = (await this.afs.doc('/Workspaces/' + workspaceID + '/Locations/' + nextID).get().toPromise()).data() as HierarchyLocation;
        if(location.shelfID){
          shelfID = location.shelfID;
          break;
        }
        
        if(location.parent){
          nextID = location.parent;
        }
        else {
          shelfID = '000';
          break;
        }
      }

      resolve(shelfID);
    });
  }

  /**
   * Returns the hierarchy items that immediately descend from a node
   * @param rootID the node to find the descendants of
   * @param isCategory category or location
   */
  getDescendantsOfRoot(workspaceID: string, rootID: string, isCategory: boolean): Observable<HierarchyItem[]> {
    const result: HierarchyItem[] = [];
    const appropriateHierarchyItems: Observable<HierarchyItem[]> = isCategory ? this.getAllCategories(workspaceID) : this.getAllLocations(workspaceID);
    return new Observable(obs => {
      appropriateHierarchyItems.subscribe(hierarchyItems => {
        hierarchyItems.forEach(cat => {
          if (cat.parent === rootID && result.filter(x => x.ID === cat.ID).length === 0) {
            result.push(cat);
          }
        });
        result.sort(function(a, b) {
          var nameA = a.name.toUpperCase(); // ignore upper and lowercase
          var nameB = b.name.toUpperCase(); // ignore upper and lowercase
          if (nameA < nameB) {
            return -1;
          }
          if (nameA > nameB) {
            return 1;
          }
        
          // names must be equal
          return 0;
        });
        obs.next(result);
        obs.complete();
      });
    });
  }

  getItem(workspaceID: string, id: string): Observable<Item> {
    return this.afs.doc<Item>('/Workspaces/' + workspaceID + '/Items/' + id).snapshotChanges().pipe(map(a => {
      const data = a.payload.data() as Item;
      //console.log(data);
      if (!data) {
        return;
      }
      data.ID = a.payload.id;
      data.type = "item";
      return data;
    }));
  }

  getLocation(workspaceID: string, id: string): Observable<HierarchyLocation> {
    if (!id || id === 'none') {
      return of(null);
    }
    return this.afs.doc<HierarchyLocation>('/Workspaces/' + workspaceID + '/Locations/' + id).snapshotChanges().pipe(map(a => {
      const data = a.payload.data() as HierarchyLocation;
      if(data){
        data.ID = a.payload.id;
        if (data.imageUrl == null) {
          data.imageUrl = '../../../assets/notFound.png';
        }
        data.type = "location";
        return data;
      }
      else {
        return null;
      }
    }));
  }

  getCategory(workspaceID: string, id: string): Observable<Category> {
    if (!id) {
      return of(null);
    }
    
    return this.afs.doc<Category>('/Workspaces/' + workspaceID + '/Category/' + id).snapshotChanges().pipe(map(a => {
      const data = a.payload.data() as Category;
      if(data){
        //console.log(data);
        data.ID = a.payload.id;
        if (data.imageUrl == null) {
          data.imageUrl = '../../../assets/notFound.png';
        }
        data.type = "category";
        return data;
      }
      else {
        return null;
      }
    }));
  }

  getAllItems(workspaceID: string): Observable<Item[]> {
    return this.afs.collection<Item>('/Workspaces/' + workspaceID + '/Items').snapshotChanges().pipe(map(a => {
      return a.map(g => {
          const data = g.payload.doc.data();
          data.ID = g.payload.doc.id;
          data.type = "item";
          return data;
        }
      );
    }));
  }

  /**
   * Find all descendant items of a hierarchy item
   * @param root the hierarchy item to find descendants of
   * @param allParents all the appropriate hierarchy items
   */
  getAllDescendantItems(workspaceID: string, root: HierarchyItem, allParents: HierarchyItem[]): Observable<Item[]> {
    if (root.ID === 'root') {
      return this.getAllItems(workspaceID);
    }
    // Make list of all children items
    const childrenItems: string[] = root.items ? JSON.parse(JSON.stringify(root.items)) : [];
    allParents.forEach(p => {
      if (p.items) {
        p.items.forEach(i => {
          if (!childrenItems.includes(i)) {
            childrenItems.push(i);
          }
        });
      }
    });
    const result: Item[] = [];
    return new Observable(obs => {
      // Find all items whose ID's are in the list of children items
      let honk = this.getAllItems(workspaceID).subscribe(items => {
        items.forEach(i => {
          if (childrenItems.includes(i.ID)) {
            result.push(i);
          }
        });
        obs.next(result);
        obs.complete(); // Dangerous if we don't close this - that's so much data to be subbed to
      },
      () => {
        obs.complete(); // Pretty sure this is never called
      });
    });
  }

  /**
   * Find all descendant hierarchy items of a hierarchy item
   * @param rootID hierarchy item to search for descendants of
   * @param isCategory category or location
   */
  getAllDescendantHierarchyItems(workspaceID: string, rootID: string, isCategory: boolean): Observable<HierarchyItem[]> {
    const result: HierarchyItem[] = [];
    const parents: string[] = [rootID];
    const appropriateHierarchyItems: Observable<HierarchyItem[]> = isCategory ? this.getAllCategories(workspaceID, true) : this.getAllLocations(workspaceID, true);
    if (rootID === 'root') {
      return appropriateHierarchyItems;
    }
    return new Observable(obs => {
      appropriateHierarchyItems.subscribe(hierarchyItems => {
        let added = true;
        while (added) {
          added = false;
          hierarchyItems.forEach(c => {
            // If the category has a parent in the parents list
            if (c.parent && parents.includes(c.parent) && !result.includes(c) && c.ID !== 'root') { // TODO make more efficient
              if (c.children && c.children.length !== 0) {
                added = true;
                parents.push(c.ID);
              }
              result.push(c);
            }
          });
        }
        obs.next(result);
        obs.complete();
      });
    });
  }

  getAllCategories(workspaceID: string, excludeRoot: boolean = false): Observable<Category[]> {
    return this.getAllHierarchy(workspaceID, excludeRoot, true);
  }

  getAllLocations(workspaceID: string, excludeRoot: boolean = false): Observable<HierarchyLocation[]> {
    return this.getAllHierarchy(workspaceID, excludeRoot, false);
  }

  private getAllHierarchy(workspaceID: string, excludeRoot: boolean, isCategory: boolean): Observable<HierarchyItem[]> {
    // TODO: proper caching and checking for updated version?
    const appropriateCache = isCategory ? this.categories : this.locations;
    // If the data is cached, return it
    if (appropriateCache) {
      return of(excludeRoot ? appropriateCache.filter(c => c.ID !== 'root') : appropriateCache);
    }

    return this.afs.collection<HierarchyItem>('/Workspaces/' + workspaceID + (isCategory ? '/Category' : '/Locations'))
      .snapshotChanges().pipe(map(a => {
        const returnedHierarchy = a.map(g => {
          const data = isCategory ? (g.payload.doc.data() as Category) : (g.payload.doc.data() as HierarchyLocation);
          data.ID = g.payload.doc.id;
          if (data.imageUrl == null) {
            data.imageUrl = '../../../assets/notFound.png';
          }
          data.type = isCategory ? 'category' : 'location';
          return data;
        });

        return excludeRoot ? returnedHierarchy.filter(g => g.ID !== 'root') : returnedHierarchy;
      }));
  }

  buildAttributeSuffixFrom(item: Item, categoryAndAncestors: Category[], startingIndex = 0): string{

    // If there's no category, return empty string
    if(!categoryAndAncestors){
      return '';
    }

    // Start building attribute string
    let buildingString = '';

    if(categoryAndAncestors[startingIndex].titleFormat){
      for(let suffixPiece of categoryAndAncestors[startingIndex].titleFormat){
        switch(suffixPiece.type){
          case 'space': {
            buildingString += ' ';
            break;
          }
          case 'text': {
            buildingString += suffixPiece.data;
            break;
          }
          case 'parent': {
            buildingString += this.buildAttributeSuffixFrom(item, categoryAndAncestors, startingIndex + 1);
            break;
          }
          case 'attribute': 
          {
            for(let attr in item.attributes){
              if(item.attributes[attr].name === suffixPiece.data){
                buildingString += item.attributes[attr].value;
                break;
              }
            }
            break;
          }
          case 'attribute layer':
          {
            for(let attr in item.attributes){

              // Find the correct piece of data in the item
              if(suffixPiece.data.startsWith(item.attributes[attr].name)){
                let splitData = suffixPiece.data.split("\n");
                let splitValues = item.attributes[attr].value.split("\n");

                // Find the corresponding layer value in that item's data
                for(let index = 0; index < (splitValues.length-1)/2; index++){
                  // If the piece of data is that layer
                  if(splitValues[index*2] === splitData[1]){
                    // Add the next piece of data, which is the layer's value
                    buildingString += splitValues[index*2+1];
                    break;
                  }
                }
                break;
              }
            }
          }
        }
      }
    }

    return buildingString;
  }

  private BinData: BinDictionary;

  /**
   * @returns comma separated location and item ID's
   */
  getItemIDFromBinID(binID: string): string {
    if(this.BinData){
      return this.BinData.bins[binID] ?? 'no ID';
    }
    else {
      return 'err';
    }
  }


  getLocationIDFromShelfID(shelfID: string): string {
    if(this.BinData){
      return this.BinData.shelves[shelfID] ?? 'no ID';
    }
    else {
      return 'err';
    }
  }

  /**
   * Used for converting numbers to a piece in a bin ID
   * 
   * @param num Assumes this is a whole number
   * @returns 
   */
  convertNumberToThreeDigitString(num: number): string {
    if(!num){
      return '000';
    }
    if(num > 999){
      return (num % 1000).toString();
    }
    if(num < 0){
      return 'err';
    }
    if(num < 10){
      return '00' + num;
    }
    if(num < 100){
      return '0' + num;
    }
    
    return num.toString();
  }

  binSub: Subscription;
  lastWorkspaceID: string = '';
   loadBinData(workspaceID: string): Promise<boolean> {
    return new Promise<boolean>(resolve => {
      if(workspaceID !== this.lastWorkspaceID){
        if(this.binSub){
          this.binSub.unsubscribe();
        }
  
        this.binSub = this.afs.doc<BinDictionary>('/Workspaces/' + workspaceID + '/StructureData/BinDictionary').snapshotChanges().subscribe(doc => {
          let data = doc.payload.data();
          if(data){
            this.BinData = data;
            resolve(true);
          }
          else {
            resolve(false);
          }
        })
      }
    })
  }

  getWorkspaceInfo(id: string): Observable<WorkspaceInfo> {
    return this.afs.doc<WorkspaceInfo>(`Workspaces/${id}`).snapshotChanges().pipe(map(a => {
      const data = a.payload.data() as WorkspaceInfo;
      //console.log(data);
      if (!data) {
        return;
      }
      return data;
    }));;
  }

  constructor(private afs: AngularFirestore, private auth: AuthService, private imageService: ImageService, private cacheService: CacheService) {
  }
}
