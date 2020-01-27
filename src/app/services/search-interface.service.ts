import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { Item } from '../models/Item';
import { HierarchyItem } from '../models/HierarchyItem';

@Injectable({
  providedIn: 'root'
})
export abstract class SearchInterfaceService {
  abstract search(term: string) : Observable<Item[]>
  abstract getItem(ID: number): Observable<Item>
  abstract categoryItemsSearch(categoryID: number) : Observable<Item[]>
  abstract categoryChildrenSearch(categoryID: number) : Observable<HierarchyItem[]>
  abstract locationItemsSearch(locationID: HierarchyItem) : Observable<Item[]>
  abstract locationChildrenSearch(locationID: HierarchyItem) : Observable<HierarchyItem[]>
}
