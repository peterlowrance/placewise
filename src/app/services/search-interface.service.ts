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
  abstract locationItemsSearch(locationID: string) : Observable<Item[]>
  abstract getCategory(id: string): Observable<HierarchyItem> 
  abstract getLocation(id: string): Observable<HierarchyItem>
  abstract getAllItems(): Observable<Item[]>
  abstract getAllCategories(): Observable<HierarchyItem[]>
  abstract getAllLocations(): Observable<HierarchyItem[]>


}
