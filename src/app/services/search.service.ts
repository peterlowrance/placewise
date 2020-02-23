import {SearchInterfaceService} from './search-interface.service';

import {Injectable} from '@angular/core';
import {HttpHeaders} from '@angular/common/http';
import {Observable, of} from 'rxjs';

import {Item} from '../models/Item';
import {HierarchyItem} from '../models/HierarchyItem';
import {AngularFirestore} from '@angular/fire/firestore';
import { AngularFireStorage } from '@angular/fire/storage';
import {finalize, map} from 'rxjs/operators';
import {AuthService} from './auth.service';
import {ImageService} from './image.service';

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

  /**
   * Finds all the ancestors of an item and returns them in a 2D array.
   * The first dimension of the array are arrays of ancestors, the second dimension is each individual ancestor.
   * @param id item to find ancestors of
   */
  getAncestorsOfItem(id: string): Observable<HierarchyItem[][]> {
    return new Observable(obs => {
      this.getAllLocations().subscribe(locs => {
        obs.next(this.getAncestors(id, locs));
        obs.complete();
      });
    });
  }

  /**
   * Returns the ancestors when you have an array of locations.
   * @param id item to find ancestors of
   * @param locations array of locations to find ancestors out of
   */
  getAncestors(id: string, locations: HierarchyItem[]): HierarchyItem[][] {
    const result: HierarchyItem[][] = [];
    // Find all parents of items and add an array for each parent
    for (const parentL1 of locations) {
      if (parentL1.items && parentL1.items.indexOf(id) > -1) {
        const ancestors: HierarchyItem[] = [parentL1];
        result.push(ancestors);
        // Find all parents in this ancestor list
        // While the last parent of the last array of ancestors is not the root
        console.log(result);
        while (result[result.length - 1][result[result.length - 1].length - 1].ID !== 'root') {
          for (const parentL2 of locations) {
            // If the item has the same ID as the parent of the last item in the ancestor list, add it
            if (parentL2.ID === result[result.length - 1][result[result.length - 1].length - 1].parent) {
              result[result.length - 1].push(parentL2);
            }
          }
        }
      }
    }
    return result;
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
          result.forEach((item) => {
            this.imageService.getImage(item.imageUrl).subscribe(link => { item.imageUrl = link; console.log(item.imageUrl); });
          });
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
          result.forEach((item) => {
            this.imageService.getImage(item.imageUrl).subscribe(link => { item.imageUrl = link; console.log(item.imageUrl); });
          });
          obs.complete();
        });
      });
    }
  }

  search(term: string): Observable<Item[]> {
    throw new Error('Method not implemented.');
  }

  getItem(id: string): Observable<Item> {
    return this.afs.doc<Item>('/Workspaces/' + this.auth.workspace.id + '/Items/' + id).snapshotChanges().pipe(map(a => {
      const data = a.payload.data() as Item;
      data.ID = a.payload.id;
      return data;
    }));
  }

  getLocation(id: string): Observable<HierarchyItem> {
    return this.afs.doc<HierarchyItem>('/Workspaces/' + this.auth.workspace.id + '/Locations/' + id).snapshotChanges().pipe(map(a => {
      const data = a.payload.data() as HierarchyItem;
      data.ID = a.payload.id;
      return data;
    }));
  }

  getCategory(id: string): Observable<HierarchyItem> {
    return this.afs.doc<HierarchyItem>('/Workspaces/' + this.auth.workspace.id + '/Category/' + id).snapshotChanges().pipe(map(a => {
      const data = a.payload.data() as HierarchyItem;
      data.ID = a.payload.id;
      return data;
    }));
  }

  getAllItems(): Observable<Item[]> {
    // this.afs.collection<Item>().snapshotChanges('/Workspaces/'+ auth.workspace.id +'/Items').subscribe(data => console.log(data));
    return this.afs.collection<Item>('/Workspaces/' + this.auth.workspace.id + '/Items').snapshotChanges().pipe(map(a => {
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
    // return this.afs.collection<Category>('/Workspaces/'+ auth.workspace.id +'/Category').valueChanges();
    return this.afs.collection<HierarchyItem>('/Workspaces/' + this.auth.workspace.id + '/Category').snapshotChanges().pipe(map(a => {
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
    // return this.afs.collection<Location>('/Workspaces/'+ auth.workspace.id +'/Locations').valueChanges();
    return this.afs.collection<HierarchyItem>('/Workspaces/' + this.auth.workspace.id + '/Locations').snapshotChanges().pipe(map(a => {
      this.locations = a.map(g => {
          const data = g.payload.doc.data() as HierarchyItem;
          data.ID = g.payload.doc.id;
          return data;
        }
      );
      return this.locations;
    }));
  }

  categoryItemsSearch(categoryID: string): Observable<Item[]> {
    return this.afs.collection<Item>('/Workspaces/' + this.auth.workspace.id + '/Category/' + categoryID + '/items').valueChanges();
  }

  locationItemsSearch(locationID: string): Observable<Item[]> {
    return this.afs.collection<Item>('/Workspaces/' + this.auth.workspace.id + '/Locations/' + locationID + '/items').valueChanges();
  }

  constructor(private afs: AngularFirestore, private auth: AuthService, private imageService: ImageService) {

  }


}
