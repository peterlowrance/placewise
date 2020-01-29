import { SearchInterfaceService } from './search-interface.service';

import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';

import { Item } from '../models/Item';
import { HierarchyItem } from '../models/HierarchyItem';

@Injectable({
  providedIn: 'root'
})
export class MockSearchService implements SearchInterfaceService{
  getItem(ID: number): Observable<Item> {
    let loc1 = {
      ID: 123,
      name: 'finishing',
      parent: null,
      children: []
    };
    let loc2 = {
      ID: 123,
      name: 'cabinet',
      parent: loc1,
      children: []
    };
    loc1.children = [loc2];
    let cat1 = {
      ID: 123,
      name: 'screws',
      parent: null,
      children: []
    };
    let item1:Item = {
        ID: 123,
        name: "2-inch Galv. Lag Screw",
        description: "Okay",
        tags: ["Hello"],
        parentLocations: [loc1],
        parentCategory: cat1,
        imageUrl: 'http://pixeljoint.com/files/icons/ethan.png'};

    return of(item1);
  }
  search(term: string): Observable<Item[]> {
    let loc1 = {
      ID: 123,
      name: 'finishing',
      parent: null,
      children: []
    };
    let loc2 = {
      ID: 123,
      name: 'cabinet',
      parent: loc1,
      children: []
    };
    loc1.children = [loc2];
    let cat1 = {
      ID: 123,
      name: 'screws',
      parent: null,
      children: []
    };
    let item1 = {
        ID: 123,
        name: "2-inch Galv. Lag Screw",
        decription: "Okay",
        tags: ["Hello"],
        parentLocations: [loc1],
        parentCategory: cat1,
        imageUrl: 'http://pixeljoint.com/files/icons/ethan.png'};

    return of([item1, item1, item1, item1]);
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
