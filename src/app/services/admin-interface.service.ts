import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { Report } from '../models/Report';
import { Item } from '../models/Item';
import { SentReport } from '../models/SentReport';

@Injectable({
  providedIn: 'root'
})
export abstract class AdminInterfaceService {
  //input for placeReport could probably just be an itemID and string of the report text
  abstract placeReport(itemID:string, text:string) : Observable<boolean>; 
  abstract getReports() : Observable<SentReport[]>;
  abstract updateItem(item: Item) : Observable<boolean>;
  abstract createItem(item: Item) : Observable<boolean>;
  abstract removeItem(itemID: number)

  abstract updateHierarchyPosition(parentID: number, moveID: number)
}
