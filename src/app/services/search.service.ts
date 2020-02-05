import {SearchInterfaceService} from './search-interface.service';

import {Injectable} from '@angular/core';
import {HttpHeaders} from '@angular/common/http';
import {Observable} from 'rxjs';

import {Item} from '../models/Item';
import {HierarchyItem} from '../models/HierarchyItem';
import {AngularFirestore, AngularFirestoreCollection} from '@angular/fire/firestore';
import { Category } from '../models/Category';

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

  getItem(id: string): Observable<Item> {
    return this.afs.doc<Item>('/Workspaces/aP87kgghQ8mqvvwcZGQV/Items/' + id).valueChanges();
  }

  getAllItems(): Observable<Item[]> {
    this.afs.collection<Item>('/Workspaces/aP87kgghQ8mqvvwcZGQV/Items').snapshotChanges().subscribe(data => console.log(data));
    return this.afs.collection<Item>('/Workspaces/aP87kgghQ8mqvvwcZGQV/Items').valueChanges();
  }

  getAllCategories(): Observable<Item[]> {
    return this.afs.collection<Item>('/Workspaces/aP87kgghQ8mqvvwcZGQV/Locations').valueChanges();
  }

  getAllLocations(): Observable<Item[]> {
    return this.afs.collection<Item>('/Workspaces/aP87kgghQ8mqvvwcZGQV/Categories').valueChanges();
  }

  categoryItemsSearch(categoryID: string): Observable<Item[]> {
    return this.afs.collection<Item>('/Workspaces/aP87kgghQ8mqvvwcZGQV/Category/' + categoryID + '/items').valueChanges();
  }

  categoryChildrenSearch(categoryID: string): Observable<Category[]> {
    console.log('path: ' + '/Workspaces/aP87kgghQ8mqvvwcZGQV/Category/' + categoryID + '/children');
    return this.afs.collection<Category>('/Workspaces/aP87kgghQ8mqvvwcZGQV/Category/' + categoryID + '/children').valueChanges();
  }

  locationItemsSearch(locationID: string): Observable<Item[]> {
    return this.afs.collection<Item>('/Workspaces/aP87kgghQ8mqvvwcZGQV/Location/' + locationID + '/items').valueChanges();  }

  locationChildrenSearch(locationID: string): Observable<HierarchyItem[]> {
    return this.afs.collection<Category>('/Workspaces/aP87kgghQ8mqvvwcZGQV/Location/' + locationID + '/children').valueChanges();
  }

  constructor(private afs: AngularFirestore) {
  }


}
