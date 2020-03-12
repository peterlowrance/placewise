import {Injectable} from '@angular/core';
import {Observable, of} from 'rxjs';

import {Item} from '../models/Item';
import {HierarchyItem} from '../models/HierarchyItem';

import * as MOCKDB from '../models/MockDB';

@Injectable({
  providedIn: 'root'
})

export class SearchService {

  locations: HierarchyItem[];
  categories: HierarchyItem[];

  /**
   * Finds all the ancestors of an item and returns them in a 2D array.
   * The first dimension of the array are arrays of ancestors, the second dimension is each individual ancestor.
   * @param id item to find ancestors of
   */
  getAncestorsOfItem(id: string): Observable<HierarchyItem[][]> {
    let ret: HierarchyItem[][];
    const item = MOCKDB.ITEMS.find((value, index, obj) => {value.ID === id}) 
    for(let i = 0; i < item.locations.length; i++){
        ret.push([]);
        let current = item.locations[i];
        while(current !== 'root'){
            let hitem = MOCKDB.LOCATIONS.find((value, index, obj) => value.ID === current);
            ret[i].push(hitem);
            current = hitem.parent;
        }
    }
    return of(ret);
  }

  getDescendantsOfRoot(id: string, isCategory: boolean): Observable<HierarchyItem[]> {
    if(isCategory){
        return of(MOCKDB.CATEGORIES.filter((value, index, array) => value.parent === id))
    }
    else return of(MOCKDB.LOCATIONS.filter((value, index, array) => value.parent === id))
  }

  search(term: string): Observable<Item[]> {
    return of(null);//TODO
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
      return of(MOCKDB.ITEMS)
    }
    let IDS: string[] = [];
    for(let parent of allParents){
        for(let item of parent.items) if(!(item in IDS)) IDS.push(item);
    }
    return of(IDS.map((value) => MOCKDB.ITEMS.find( (v) => v.ID ===  value)));
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
    if(excludeRoot) return of(MOCKDB.CATEGORIES.slice(1));
    else return of(MOCKDB.CATEGORIES)
  }

  getAllLocations(excludeRoot: boolean = false): Observable<HierarchyItem[]> {
    if(excludeRoot) return of(MOCKDB.LOCATIONS.slice(1));
    else return of(MOCKDB.LOCATIONS);
  }

  constructor() {

  }
}
