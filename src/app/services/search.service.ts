import { Injectable } from '@angular/core';
import { Item } from '../models/Item';
import { Observable, of } from 'rxjs'

@Injectable({
  providedIn: 'root'
})
export class SearchService {

  constructor() { }

  getItem(id: string): Observable<Item> {
    //TODO: interface with firebase to retrieve the item at the given index

    //FIXME: replace with firebase
    return of(
      {
        name:'2-inch galvanized lag screw',
        description: "A screw, 2-inches long, coverted in galvanized dust. It's used for putting things together.",
        tags: ["screw", "galvanized", "2 inch"],
        locations: [{ref: ""},{ref: ""},{ref: ""}],
        category: "Screws",
        imageUrl: "https://images.homedepot-static.com/productImages/a9323fbb-42b3-4ed7-a666-630ddeb7888d/svn/everbilt-lag-bolts-803716-64_1000.jpg"
      }
      );
  }
}
