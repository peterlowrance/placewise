import { SearchInterfaceService } from './search-interface.service';

import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { Item } from '../models/Item';
import { HierarchyItem } from '../models/HierarchyItem';

@Injectable({
  providedIn: 'root'
})
export class MockSearchService implements SearchInterfaceService{
  search(term: string): Observable<Item[]> {
    loc1 = {
      ID: 123,
      name: 'finishing',
      parent: null,
      children: {}
    };
    loc2 = {
      ID: 123,
      name: 'cabinet',
      parent: loc1,
      children: {}
    };
    loc1.children = {loc2};
    cat1 = {
      ID: 123,
      name: 'screws',
      parent: null,
      children: {}
    };
    item1 = {
        ID: 123,
        name: "2-inch Galv. Lag Screw",
        decription?: "Okay",
        tags?: {},
        parentLocations: {loc1},
        parentCategories: cat1,
        imageUrl?: 'http://pixeljoint.com/files/icons/ethan.png'};
    return of({item1});
  }
  categoryItemsSearch(categoryID: number): Observable<Item[]> {
    throw new Error("Method not implemented.");
  }
  categoryChildrenSearch(categoryID: number): Observable<HierarchyItem[]> {
    throw new Error("Method not implemented.");
  }
  locationItemsSearch(location: HierarchyItem): Observable<Item[]> {
    throw new Error("Method not implemented.");
  }
  locationChildrenSearch(location: HierarchyItem): Observable<HierarchyItem[]> {
    throw new Error("Method not implemented.");
  }

  constructor() { }
}
