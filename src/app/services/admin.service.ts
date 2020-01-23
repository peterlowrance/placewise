import { AdminInterfaceService } from './admin-interface.service';

import { Injectable } from '@angular/core';
import { HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';

import { Report } from '../models/Report';
import { Item } from '../models/Item';

const httpOptions = {
  headers: new HttpHeaders({ 
    'Content-Type': 'application/json'
   })
};

@Injectable({
  providedIn: 'root'
})
export class AdminService implements AdminInterfaceService{
  placeReport(itemID: number, text: string): Observable<boolean> {
    throw new Error("Method not implemented.");
  }
  getReports(): Observable<Report[]> {
    throw new Error("Method not implemented.");
  }
  updateItem(item: Item): Observable<boolean> {
    throw new Error("Method not implemented.");
  }
  createItem(name: string, decription: string, tags: string[], locations: string, category: string, imageUrl: string): Observable<boolean> {
    throw new Error("Method not implemented.");
  }
  removeItem(itemID: number) {
    throw new Error("Method not implemented.");
  }
  updateHierarchyPosition(parentID: number, moveID: number) {
    throw new Error("Method not implemented.");
  }

  constructor() { }
}
