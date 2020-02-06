import {SearchInterfaceService} from './search-interface.service';

import {Injectable} from '@angular/core';
import {HttpHeaders} from '@angular/common/http';
import {Observable} from 'rxjs';

import {Item} from '../models/Item';
import {HierarchyItem} from '../models/HierarchyItem';
import {AngularFirestore} from '@angular/fire/firestore';
import {Category} from '../models/Category';
import {Location} from '../models/Location';
import {map} from 'rxjs/operators';

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
    // this.afs.collection<Item>().snapshotChanges('/Workspaces/aP87kgghQ8mqvvwcZGQV/Items').subscribe(data => console.log(data));
    return this.afs.collection<Item>('/Workspaces/aP87kgghQ8mqvvwcZGQV/Items').snapshotChanges().pipe(map(a => {
      return a.map(g => {
          const data = g.payload.doc.data() as Item;
          data.ID = g.payload.doc.id;
          return data;
        }
      );
    }));
  }

  getAllCategories(): Observable<Category[]> {
    return this.afs.collection<Category>('/Workspaces/aP87kgghQ8mqvvwcZGQV/Category').valueChanges();
  }

  getAllLocations(): Observable<Location[]> {
    return this.afs.collection<Location>('/Workspaces/aP87kgghQ8mqvvwcZGQV/Locations').valueChanges();
  }

  categoryItemsSearch(categoryID: string): Observable<Item[]> {
    return this.afs.collection<Item>('/Workspaces/aP87kgghQ8mqvvwcZGQV/Category/' + categoryID + '/items').valueChanges();
  }

  categoryChildrenSearch(categoryID: string): Observable<Category[]> {
    return this.afs.collection<Category>('/Workspaces/aP87kgghQ8mqvvwcZGQV/Category/' + categoryID + '/children').snapshotChanges().pipe(
      map(a => {
        return a.map(g => {
            console.log(g.payload.doc.data());
            const data = g.payload.doc.data() as Category;
            data.ID = g.payload.doc.id;
            return data;
          }
        );
      }));
  }

  locationItemsSearch(locationID: string): Observable<Item[]> {
    return this.afs.collection<Item>('/Workspaces/aP87kgghQ8mqvvwcZGQV/Location/' + locationID + '/items').valueChanges();
  }

  locationChildrenSearch(locationID: string): Observable<HierarchyItem[]> {
    return this.afs.collection<Category>('/Workspaces/aP87kgghQ8mqvvwcZGQV/Location/' + locationID + '/children').snapshotChanges().pipe(
      map(a => {
      return a.map(g => {
          console.log(g.payload.doc.data());
          const data = g.payload.doc.data() as Category;
          data.ID = g.payload.doc.id;
          return data;
        }
      );
    }));
  }

  constructor(private afs: AngularFirestore) {
  }


}
