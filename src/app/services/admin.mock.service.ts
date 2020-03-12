// import { AdminInterfaceService } from './admin-interface.service';

import {Injectable} from '@angular/core';
import {HttpHeaders} from '@angular/common/http';
import {Observable, of} from 'rxjs';
import {Item} from '../models/Item';
import {SentReport} from '../models/SentReport';

@Injectable({
  providedIn: 'root'
})
export class AdminService // implements AdminInterfaceService
{
  placeReport(itemID: string, text: string): Observable<boolean> {
    return of(true);
  }

  getReports(): Observable<SentReport[]> {
    return of([{item: 'I1', desc: 'An item', user: 'Bobbo', ID: '1'}, {item: 'I2', desc: 'An item 2', user: 'Benny', ID: '2'}, {item: 'I3', desc: 'Last item', user: 'Kenneth', ID: '3'}]);
  }

  updateItem(item: Item): Observable<boolean> {
    return of(true);
  }

  createItem(item: Item): Observable<boolean> {
    return of(true);
  }

  createItemAtLocation(name: string, desc: string, tags: string[], category: string, imageUrl: string, location: string): Observable<boolean> {
    return of(true);
  }

  removeItem(itemID: number) {
    return of(true);
  }

  updateHierarchyPosition(parentID: number, moveID: number) {
    throw new Error('Method not implemented.');
  }

  constructor() {}
}