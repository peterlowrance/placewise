// import { AdminInterfaceService } from './admin-interface.service';

import {Injectable} from '@angular/core';
import {HttpHeaders} from '@angular/common/http';
import {Observable, of} from 'rxjs';
import {Item} from '../models/Item';
import {SentReport} from '../models/SentReport';
import {Report} from '../models/Report';

@Injectable({
  providedIn: 'root'
})
export class AdminMockService {
  placeReport(itemID: string, text: string): Observable<boolean> {
    return of(true);
  }

  getReports(): Observable<SentReport[]> {
    const trueItem: Item = {name: 'test', ID: '1', locations: [], category: 'cat'};
    const report: SentReport = {item: 'I1', desc: 'an item', user: 'aP87kgghQ8mqvvwcZGQV', ID: '1', trueItem, userName: 'Bobbo'};
    return of([report]);
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
