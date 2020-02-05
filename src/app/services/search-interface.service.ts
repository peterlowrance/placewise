import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { Item } from '../models/Item';
import { HierarchyItem } from '../models/HierarchyItem';
import { Category } from '../models/Category';

@Injectable({
  providedIn: 'root'
})
export abstract class SearchInterfaceService {
  abstract search(term: string) : Observable<Item[]>
  abstract getItem(ID: string): Observable<Item>
  abstract categoryItemsSearch(categoryID: string) : Observable<Item[]>
  abstract categoryChildrenSearch(categoryID: string) : Observable<Category[]>
  abstract locationItemsSearch(locationID: string) : Observable<Item[]>
  abstract locationChildrenSearch(locationID: string) : Observable<HierarchyItem[]>
}
