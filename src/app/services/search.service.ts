import {SearchInterfaceService} from './search-interface.service';

import {Injectable} from '@angular/core';
import {HttpHeaders} from '@angular/common/http';
import {Observable} from 'rxjs';

import {Item} from '../models/Item';
import {HierarchyItem} from '../models/HierarchyItem';
import {AngularFirestore, AngularFirestoreCollection} from '@angular/fire/firestore';
import { Category } from '../models/Category';
import { map } from 'rxjs/operators';

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
    //this.afs.collection<Item>().snapshotChanges('/Workspaces/aP87kgghQ8mqvvwcZGQV/Items').subscribe(data => console.log(data));
    let items = this.afs.collection<Item>('/Workspaces/aP87kgghQ8mqvvwcZGQV/Items').snapshotChanges().pipe(map(a =>
      {
        return a.map(g =>
          {
            console.log(g.payload.doc.data())
            const data = g.payload.doc.data() as Item
            data.ID = g.payload.doc.id;
            return data;
          }
        )
      }))
    items.subscribe(data => console.log(data))
    return items;
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
    let query = '/Workspaces/aP87kgghQ8mqvvwcZGQV/Category/' + categoryID + '/children'
    let categories = this.afs.collection<Category>(query).snapshotChanges().pipe(map(a =>
      {
        return a.map(g =>
          {
            console.log(g.payload.doc.data())
            const data = g.payload.doc.data() as Category
            data.ID = g.payload.doc.id;
            return data;
          }
        )
      }))
    return categories
  }

  locationItemsSearch(locationID: string): Observable<Item[]> {
    return this.afs.collection<Item>('/Workspaces/aP87kgghQ8mqvvwcZGQV/Location/' + locationID + '/items').valueChanges();  }

  locationChildrenSearch(locationID: string): Observable<HierarchyItem[]> {
  
    let query = '/Workspaces/aP87kgghQ8mqvvwcZGQV/Location/' + locationID + '/children'
    let locations = this.afs.collection<Category>(query).snapshotChanges().pipe(map(a =>
      {
        return a.map(g =>
          {
            console.log(g.payload.doc.data())
            const data = g.payload.doc.data() as Category
            data.ID = g.payload.doc.id;
            return data;
          }
        )
      }))
    return locations
  }

  constructor(private afs: AngularFirestore) {
  }


}
