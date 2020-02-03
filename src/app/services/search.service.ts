import {SearchInterfaceService} from './search-interface.service';

import {Injectable} from '@angular/core';
import {HttpHeaders} from '@angular/common/http';
import {Observable} from 'rxjs';

import {Item} from '../models/Item';
import {HierarchyItem} from '../models/HierarchyItem';
import {AngularFirestore, AngularFirestoreCollection} from '@angular/fire/firestore';

const httpOptions = {
  headers: new HttpHeaders({
    'Content-Type': 'application/json'
  })
};

@Injectable({
  providedIn: 'root'
})
export class SearchService implements SearchInterfaceService {
  search(term: string): Observable<Item[]> {
    throw new Error('Method not implemented.');
  }

  getItem(id: number): Observable<Item> {
    // TODO: interface with firebase to retrieve the item at the given index

    // FIXME: replace with firebase
    throw new Error('Method not implemented.');
  }

  getAllItems(): Observable<Item[]> {
    return this.afs.collection<Item>('/Workspaces/aP87kgghQ8mqvvwcZGQV/Items').valueChanges();
  }

  categoryItemsSearch(categoryID: number): Observable<Item[]> {
    throw new Error('Method not implemented.');
  }

  categoryChildrenSearch(categoryID: number): Observable<HierarchyItem[]> {
    throw new Error('Method not implemented.');
  }

  locationItemsSearch(location: HierarchyItem): Observable<Item[]> {
    throw new Error('Method not implemented.');
  }

  locationChildrenSearch(location: HierarchyItem): Observable<HierarchyItem[]> {
    throw new Error('Method not implemented.');
  }

  constructor(private afs: AngularFirestore) {
  }


}
