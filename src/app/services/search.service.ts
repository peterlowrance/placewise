import {SearchInterfaceService} from './search-interface.service';

import {Injectable} from '@angular/core';
import {HttpHeaders} from '@angular/common/http';
import {Observable, of} from 'rxjs';

import {Item} from '../models/Item';
import {HierarchyItem} from '../models/HierarchyItem';
import {AngularFirestore} from '@angular/fire/firestore';
import {map} from 'rxjs/operators';
import {AuthService} from './auth.service';

const httpOptions = {
  headers: new HttpHeaders({
    'Content-Type': 'application/json'
  })
};

@Injectable({
  providedIn: 'root'
})

export class SearchService implements SearchInterfaceService {

  locations: HierarchyItem[];
  categories: HierarchyItem[];

  getAncestorsOfItem(id: string): HierarchyItem[][] {
    // n wide for every location, x tall for the parents to parents to root
    return null;
  }

  getDescendantsOfRoot(id: string, isCategory: boolean): Observable<HierarchyItem[]> {
    const result: HierarchyItem[] = [];
    if (isCategory) {
      return new Observable(obs => {
        this.getAllCategories().subscribe(cats => {
          cats.forEach(cat => {
            if (cat.parent === id) {
              result.push(cat);
            }
          });
          obs.next(result);
          obs.complete();
        });
      });
    } else {
      return new Observable(obs => {
        this.getAllLocations().subscribe(cats => {
          cats.forEach(cat => {
            if (cat.parent === id) {
              result.push(cat);
            }
          });
          obs.next(result);
          obs.complete();
        });
      });
    }
  }

  search(term: string): Observable<Item[]> {
    throw new Error('Method not implemented.');
  }

  getItem(id: string): Observable<Item> {
    return this.afs.doc<Item>('/Workspaces/aP87kgghQ8mqvvwcZGQV/Items/' + id).snapshotChanges().pipe(map(a => {
      const data = a.payload.data() as Item;
      data.ID = a.payload.id;
      return data;
    }));
  }

  getLocation(id: string): Observable<HierarchyItem> {
    return this.afs.doc<HierarchyItem>('/Workspaces/aP87kgghQ8mqvvwcZGQV/Locations/' + id).snapshotChanges().pipe(map(a => {
      const data = a.payload.data() as HierarchyItem;
      data.ID = a.payload.id;
      return data;
    }));
  }

  getCategory(id: string): Observable<HierarchyItem> {
    return this.afs.doc<HierarchyItem>('/Workspaces/aP87kgghQ8mqvvwcZGQV/Category/' + id).snapshotChanges().pipe(map(a => {
      const data = a.payload.data() as HierarchyItem;
      data.ID = a.payload.id;
      return data;
    }));
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

  getAllCategories(): Observable<HierarchyItem[]> {
    if (this.categories) {
      return of(this.categories);
    }
    // return this.afs.collection<Category>('/Workspaces/aP87kgghQ8mqvvwcZGQV/Category').valueChanges();
    return this.afs.collection<HierarchyItem>('/Workspaces/aP87kgghQ8mqvvwcZGQV/Category').snapshotChanges().pipe(map(a => {
      this.categories = a.map(g => {
          const data = g.payload.doc.data() as HierarchyItem;
          data.ID = g.payload.doc.id;
          return data;
        }
      );
      return this.categories;
    }));
  }

  getAllLocations(): Observable<HierarchyItem[]> {
    if (this.locations) {
      return of(this.locations);
    }
    // return this.afs.collection<Location>('/Workspaces/aP87kgghQ8mqvvwcZGQV/Locations').valueChanges();
    return this.afs.collection<HierarchyItem>('/Workspaces/aP87kgghQ8mqvvwcZGQV/Locations').snapshotChanges().pipe(map(a => {
      this.locations =  a.map(g => {
          const data = g.payload.doc.data() as HierarchyItem;
          data.ID = g.payload.doc.id;
          return data;
        }
      );
      return this.locations;
    }));
  }

  categoryItemsSearch(categoryID: string): Observable<Item[]> {
    return this.afs.collection<Item>('/Workspaces/aP87kgghQ8mqvvwcZGQV/Category/' + categoryID + '/items').valueChanges();
  }

  locationItemsSearch(locationID: string): Observable<Item[]> {
    return this.afs.collection<Item>('/Workspaces/aP87kgghQ8mqvvwcZGQV/Locations/' + locationID + '/items').valueChanges();
  }

  constructor(private afs: AngularFirestore, private auth: AuthService) {

  }


}
