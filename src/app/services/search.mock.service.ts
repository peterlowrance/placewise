import {Injectable} from '@angular/core';
import {Observable, of} from 'rxjs';

import {Item} from '../models/Item';
import {HierarchyItem} from '../models/HierarchyItem';

import * as MOCKDB from '../models/MockDB';

@Injectable({
  providedIn: 'root'
})

export class SearchMockService {

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
    return of(MOCKDB.ITEMS.find((value, index, obj) => value.ID === id));
  }

  getLocation(id: string): Observable<HierarchyItem> {
    return of(MOCKDB.LOCATIONS.find((value, index, obj) => value.ID === id));
  }

  getCategory(id: string): Observable<HierarchyItem> {
    return of(MOCKDB.CATEGORIES.find((value, index, obj) => value.ID === id));
  }

  getAllItems(): Observable<Item[]> {
    return of(MOCKDB.ITEMS);
  }

  getAllDescendantItems(root: HierarchyItem, allParents: HierarchyItem[]): Observable<Item[]> {
    if (root.ID === 'root') {
      return of(MOCKDB.ITEMS);
    }
    const IDS: string[] = [];
    for (const parent of allParents) {
      for (const item of parent.items) if (!(item in IDS)) IDS.push(item);
    }
    return of(IDS.map((value) => MOCKDB.ITEMS.find((v) => v.ID === value)));
  }

  getAllDescendantHierarchyItems(id: string, isCategory: boolean): Observable<HierarchyItem[]> {
    const result: HierarchyItem[] = [];
    const parents: string[] = [id];
    const appropriateHierarchyItems = isCategory ? this.getAllCategories(true) : this.getAllLocations(true);
    if (id === 'root') {
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
    if (excludeRoot) return of(MOCKDB.CATEGORIES.slice(1));
    else return of(MOCKDB.CATEGORIES);
  }

  getAllLocations(excludeRoot: boolean = false): Observable<HierarchyItem[]> {
    if (excludeRoot) return of(MOCKDB.LOCATIONS.slice(1));
    else return of(MOCKDB.LOCATIONS);
  }

  constructor() {

  }
}
