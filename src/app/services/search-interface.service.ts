import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { Item } from '../models/Item';
import { HierarchyItem } from '../models/HierarchyItem';
import { Category } from '../models/Category';

@Injectable({
  providedIn: 'root'
})
export abstract class SearchInterfaceService {
  abstract getItem(workspaceID: string, ID: string): Observable<Item>
  abstract getCategory(workspaceID: string, id: string): Observable<HierarchyItem>
  abstract getLocation(workspaceID: string, id: string): Observable<HierarchyItem>
  abstract getAllItems(workspaceID: string): Observable<Item[]>
  abstract getAllCategories(workspaceID: string): Observable<HierarchyItem[]>
  abstract getAllLocations(workspaceID: string): Observable<HierarchyItem[]>
}
