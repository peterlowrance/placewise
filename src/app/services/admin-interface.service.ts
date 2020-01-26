import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { Report } from '../models/Report';
import { Item } from '../models/Item';

@Injectable({
  providedIn: 'root'
})
export abstract class AdminInterfaceService {
  //input for placeReport could probably just be an itemID and string of the report text
  abstract placeReport(itemID:number, text:string) : Observable<boolean>; 
  abstract getReports() : Observable<Report[]>;
  abstract updateItem(item: Item) : Observable<boolean>;
  abstract createItem(name: string, decription: string, tags: string[], locations: string, category: string, imageUrl: string) : Observable<boolean>;
  abstract removeItem(itemID: number)

  abstract updateHierarchyPosition(parentID: number, moveID: number)
}
