import {SearchInterfaceService} from './search-interface.service';

import {Injectable} from '@angular/core';
import {HttpHeaders} from '@angular/common/http';
import {Observable, of} from 'rxjs';

import {Item} from '../models/Item';
import {HierarchyItem} from '../models/HierarchyItem';
import {AngularFirestore} from '@angular/fire/firestore';
import {map} from 'rxjs/operators';
import {AuthService} from './auth.service';
import {ImageService} from './image.service';

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
  categories: HierarchyItem[];

  /**
   * Finds all the ancestors of an item and returns them in a 2D array.
   * The first dimension of the array are arrays of ancestors, the second dimension is each individual ancestor.
   * @param id item to find ancestors of
   */
  getAncestorsOfItem(id: string): Observable<HierarchyItem[][]> {
    return new Observable(obs => {
      this.getAllLocations().subscribe(locs => {
        obs.next(this.getAncestors(id, locs));
        obs.complete();
      });
    });
  }

  /**
   * Returns the ancestors when you have an array of locations.
   * @param id item to find ancestors of
   * @param locations array of locations to find ancestors out of
   */
  getAncestors(id: string, locations: HierarchyItem[]): HierarchyItem[][] {
    const result: HierarchyItem[][] = [];
    // Find all parents of items and add an array for each parent
    for (const parentL1 of locations) {
      if (parentL1.items && parentL1.items.indexOf(id) > -1) {
        const ancestors: HierarchyItem[] = [parentL1];
        result.push(ancestors);
        // Find all parents in this ancestor list
        // While the last parent of the last array of ancestors is not the root
        console.log(result);
        while (result[result.length - 1][result[result.length - 1].length - 1].ID !== 'root') {
          for (const parentL2 of locations) {
            // If the item has the same ID as the parent of the last item in the ancestor list, add it
            if (parentL2.ID === result[result.length - 1][result[result.length - 1].length - 1].parent) {
              result[result.length - 1].push(parentL2);
            }
          }
        }
      }
    }
    return result;
  }

  /**
   * Returns the hierarchy items that immediately descend from a node
   * @param rootID the node to find the descendants of
   * @param isCategory category or location
   */
  getDescendantsOfRoot(rootID: string, isCategory: boolean): Observable<HierarchyItem[]> {
    const result: HierarchyItem[] = [];
    const appropriateHierarchyItems = isCategory ? this.getAllCategories() : this.getAllLocations();
    return new Observable(obs => {
      appropriateHierarchyItems.subscribe(hierarchyItems => {
        hierarchyItems.forEach(cat => {
          if (cat.parent === rootID && result.filter(x => x.ID === cat.ID).length === 0) {
            result.push(cat);
          }
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
        console.error('Error when getting item ' + id);
      }
      data.ID = a.payload.id;
      return data;
    }));
  }

  getLocation(id: string): Observable<HierarchyItem> {
    if (!id) {
      return of(null);
    }
    return this.afs.doc<HierarchyItem>('/Workspaces/' + this.auth.workspace.id + '/Locations/' + id).snapshotChanges().pipe(map(a => {
      const data = a.payload.data() as HierarchyItem;
      data.ID = a.payload.id;
      if (data.imageUrl == null) {
        data.imageUrl = '../../../assets/notFound.png';
      }
      return data;
    }));
  }

  getCategory(id: string): Observable<HierarchyItem> {
    if (!id) {
      return of(null);
    }
    return this.afs.doc<HierarchyItem>('/Workspaces/' + this.auth.workspace.id + '/Category/' + id).snapshotChanges().pipe(map(a => {
      const data = a.payload.data() as HierarchyItem;
      data.ID = a.payload.id;
      if (data.imageUrl == null) {
        data.imageUrl = '../../../assets/notFound.png';
      }
      return data;
    }));
  }

  getAllItems(): Observable<Item[]> {
    // this.afs.collection<Item>().snapshotChanges('/Workspaces/'+ auth.workspace.id +'/Items').subscribe(data => console.log(data));
    return this.afs.collection<Item>('/Workspaces/' + this.auth.workspace.id + '/Items').snapshotChanges().pipe(map(a => {
      return a.map(g => {
          const data = g.payload.doc.data() as Item;
          data.ID = g.payload.doc.id;
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
    const childrenItems: string[] = root.items ? root.items : [];
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
      this.getAllItems().subscribe(items => {
        items.forEach(i => {
          if (childrenItems.includes(i.ID)) {
            result.push(i);
          }
        });
        obs.next(result);
        obs.complete();
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
    const appropriateHierarchyItems = isCategory ? this.getAllCategories(true) : this.getAllLocations(true);
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

  getAllCategories(excludeRoot: boolean = false): Observable<HierarchyItem[]> {
    return this.getAllHierarchy(excludeRoot, true);
  }

  getAllLocations(excludeRoot: boolean = false): Observable<HierarchyItem[]> {
    return this.getAllHierarchy(excludeRoot, false);
  }

  private getAllHierarchy(excludeRoot: boolean, isCategory: boolean): Observable<HierarchyItem[]> {
    // TODO: proper caching and checking for updated version?
    const appropriateCache = isCategory ? this.categories : this.locations;
    // If the data is cached, return it
    if (appropriateCache) {
      console.log('returning from cache');
      return of(excludeRoot ? appropriateCache.filter(c => c.ID !== 'root') : appropriateCache);
    }
    return this.afs.collection<HierarchyItem>('/Workspaces/' + this.auth.workspace.id + (isCategory ? '/Category' : '/Locations'))
      .snapshotChanges().pipe(map(a => {
        let returnedHierarchy = a.map(g => {
          const data = g.payload.doc.data() as HierarchyItem;
          data.ID = g.payload.doc.id;
          if (data.imageUrl == null) {
            data.imageUrl = '../../../assets/notFound.png';
          }
          return data;
        });
        return excludeRoot ? returnedHierarchy.filter(g => g.ID !== 'root') : returnedHierarchy;
      }));
  }

  constructor(private afs: AngularFirestore, private auth: AuthService, private imageService: ImageService) {
  }
}
