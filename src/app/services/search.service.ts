import {SearchInterfaceService} from './search-interface.service';

import {Injectable} from '@angular/core';
import {HttpHeaders} from '@angular/common/http';
import {Observable, of, observable} from 'rxjs';

import {Item} from '../models/Item';
import {HierarchyItem} from '../models/HierarchyItem';
import {AngularFirestore} from '@angular/fire/firestore';
import {map, first} from 'rxjs/operators';
import {AuthService} from './auth.service';
import {ImageService} from './image.service';
import { HierarchyObject } from '../models/HierarchyObject';
import { Category } from '../models/Category';
import { Location } from '../models/Location';

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
    for(const parentID of parentIDs)                                            // TODO: YIKES
    for(const firstParent of hierItems) {
      if (firstParent.ID === parentID) {
        const ancestors: HierarchyItem[] = [firstParent];
        result.push(ancestors);
        // Find all parents in this ancestor list
        // While the last parent of the last array of ancestors is not the root
        while (result[result.length - 1][result[result.length - 1].length - 1].ID !== 'root') {
          for (const nextParent of hierItems) {
            // If the item has the same ID as the parent of the last item in the ancestor list, add it
            if (nextParent.ID === result[result.length - 1][result[result.length - 1].length - 1].parent) {
              result[result.length - 1].push(nextParent);
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
  getAncestorsOf(item: HierarchyObject): Observable<HierarchyItem[][]> {
    
    return new Observable(obs => {
    if(item.type === "item"){
        this.getAllLocations().subscribe(locs => {
          obs.next(this.getAncestors((item as Item).locations, locs));
          obs.complete();
        });
    }
    else {
        let hierItem = item as HierarchyItem;
        if(hierItem.type === 'category'){
          this.getAllCategories().subscribe(categories =>
            {
              obs.next(this.getAncestors([hierItem.parent], categories));

              if(categories.length > 1){  // Finish when we have all the data (It always has at least a length of one ??)
                obs.complete();
              }
            })
        } else {
          this.getAllLocations().subscribe(locations =>
            {
              obs.next(this.getAncestors([hierItem.parent], locations));
              
              if(locations.length > 1){  // Finish when we have all the data (It always has at least a length of one ??)
                obs.complete();
              }
            })
        }
      }
    });
  }

  /**
   * Returns the hierarchy items that immediately descend from a node
   * @param rootID the node to find the descendants of
   * @param isCategory category or location
   */
  getDescendantsOfRoot(rootID: string, isCategory: boolean): Observable<HierarchyItem[]> {
    const result: HierarchyItem[] = [];
    const appropriateHierarchyItems: Observable<HierarchyItem[]> = isCategory ? this.getAllCategories() : this.getAllLocations();
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

  getItem(id: string): Observable<Item> {
    return this.afs.doc<Item>('/Workspaces/' + this.auth.workspace.id + '/Items/' + id).snapshotChanges().pipe(map(a => {
      const data = a.payload.data() as Item;
      if (!data) {
        return;
      }
      data.ID = a.payload.id;
      data.type = "item";
      return data;
    }));
  }

  getLocation(id: string): Observable<Location> {
    if (!id) {
      return of(null);
    }
    return this.afs.doc<Location>('/Workspaces/' + this.auth.workspace.id + '/Locations/' + id).snapshotChanges().pipe(map(a => {
      const data = a.payload.data() as Location;
      data.ID = a.payload.id;
      if (data.imageUrl == null) {
        data.imageUrl = '../../../assets/notFound.png';
      }
      data.type = "location";
      return data;
    }));
  }

  getCategory(id: string): Observable<Category> {
    if (!id) {
      return of(null);
    }
    //console.time('firebase answered category in');
    return this.afs.doc<Category>('/Workspaces/' + this.auth.workspace.id + '/Category/' + id).snapshotChanges().pipe(map(a => {
      //console.timeEnd('firebase answered category in');
      const data = a.payload.data() as Category;
      data.ID = a.payload.id;
      if (data.imageUrl == null) {
        data.imageUrl = '../../../assets/notFound.png';
      }
      data.type = "category";
      return data;
    }));
  }

  getAllItems(): Observable<Item[]> {
    return this.afs.collection<Item>('/Workspaces/' + this.auth.workspace.id + '/Items').snapshotChanges().pipe(map(a => {
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
  getAllDescendantItems(root: HierarchyItem, allParents: HierarchyItem[]): Observable<Item[]> {
    if (root.ID === 'root') {
      return this.getAllItems();
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
      let honk = this.getAllItems().subscribe(items => {
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
  getAllDescendantHierarchyItems(rootID: string, isCategory: boolean): Observable<HierarchyItem[]> {
    const result: HierarchyItem[] = [];
    const parents: string[] = [rootID];
    const appropriateHierarchyItems: Observable<HierarchyItem[]> = isCategory ? this.getAllCategories(true) : this.getAllLocations(true);
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

  getAllCategories(excludeRoot: boolean = false): Observable<Category[]> {
    return this.getAllHierarchy(excludeRoot, true);
  }

  getAllLocations(excludeRoot: boolean = false): Observable<Location[]> {
    return this.getAllHierarchy(excludeRoot, false);
  }

  private getAllHierarchy(excludeRoot: boolean, isCategory: boolean): Observable<HierarchyItem[]> {
    // TODO: proper caching and checking for updated version?
    const appropriateCache = isCategory ? this.categories : this.locations;
    // If the data is cached, return it
    if (appropriateCache) {
      return of(excludeRoot ? appropriateCache.filter(c => c.ID !== 'root') : appropriateCache);
    }
    //console.time('firebase answered get all in');
    return this.afs.collection<HierarchyItem>('/Workspaces/' + this.auth.workspace.id + (isCategory ? '/Category' : '/Locations'))
      .snapshotChanges().pipe(map(a => {
        //if(a.length > 1 ) console.timeEnd('firebase answered get all in'); // cache likes to store one that is returned
        const returnedHierarchy = a.map(g => {
          const data = isCategory ? (g.payload.doc.data() as Category) : (g.payload.doc.data() as Location);
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

  constructor(private afs: AngularFirestore, private auth: AuthService, private imageService: ImageService) {
  }
}
