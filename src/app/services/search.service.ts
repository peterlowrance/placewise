import { SearchInterfaceService } from './search-interface.service';

import { Injectable } from '@angular/core';
import { HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { of } from 'rxjs';

import { Item } from '../models/Item';
import { HierarchyItem } from '../models/HierarchyItem';

const httpOptions = {
  headers: new HttpHeaders({ 
    'Content-Type': 'application/json'
   })
};

@Injectable({
  providedIn: 'root'
})
export class SearchService implements SearchInterfaceService{
  search(term: string): Observable<Item[]> {
    throw new Error("Method not implemented.");
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

  getItem(id: string): Observable<Item> {
    //TODO: interface with firebase to retrieve the item at the given index

    //FIXME: replace with firebase
    return of(
      {
        ID: 1,
        name:'2-inch galvanized lag screw',
        description: "A screw, 2-inches long, coverted in galvanized dust. It's used for putting things together.",
        tags: ["screw", "galvanized", "2 inch"],
        locations: "",
        category: "Screws",
        imageUrl: "https://images.homedepot-static.com/productImages/a9323fbb-42b3-4ed7-a666-630ddeb7888d/svn/everbilt-lag-bolts-803716-64_1000.jpg"
      }
      );
  }
}
