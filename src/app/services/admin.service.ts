// import { AdminInterfaceService } from './admin-interface.service';

import {Injectable} from '@angular/core';
import {HttpHeaders} from '@angular/common/http';
import {Observable, of} from 'rxjs';
import {Item} from '../models/Item';
import {AngularFirestore} from '@angular/fire/firestore';
import {AuthService} from './auth.service';
import {SentReport} from '../models/SentReport';
import {map} from 'rxjs/operators';

const httpOptions = {
  headers: new HttpHeaders({
    'Content-Type': 'application/json'
  })
};

@Injectable({
  providedIn: 'root'
})
export class AdminService // implements AdminInterfaceService
{
  placeReport(itemID: string, text: string): Observable<boolean> {
    this.afs.collection('/Workspaces/' + this.auth.workspace.id + '/Reports').add({
      desc: text,
      item: itemID,
      user: this.auth.getAuth().subscribe(x => x.uid)
    });

    return of(true);
  }

  getReports(): Observable<SentReport[]> {
    console.log('/Workspaces/' + this.auth.workspace.id + '/Reports');
    return this.afs.collection<SentReport>('/Workspaces/' + this.auth.workspace.id + '/Reports').snapshotChanges().pipe(
      map(a => {
        return a.map(g => {
            const data = g.payload.doc.data() as SentReport;
            data.ID = g.payload.doc.id;
            return data;
          }
        );
    }));
  }

  clearReports(reports: SentReport[]): Observable<Boolean> {
    for(let i = 0; i < reports.length; i++)
    {
      console.log("reportdel")
      this.afs.doc<Item>('/Workspaces/' + this.auth.workspace.id + '/Reports/' + reports[i].ID).delete();
    }
    reports = [];
    return of(true);
  }

  updateItem(item: Item): Observable<boolean> {
    this.afs.doc<Item>('/Workspaces/' + this.auth.workspace.id + '/Items/' + item.ID).set(item);
    return of(true);
  }

  createItem(item: Item): Observable<boolean> {
    this.afs.collection('/Workspaces/' + this.auth.workspace.id + '/Items').add({
      item
    });
    return of(true);
  }

  createItemAtLocation(name: string, desc: string, tags: string[], category: string, imageUrl: string, location: string): Observable<boolean> {
    // console.log("frankin");
    this.afs.collection('/Workspaces/' + this.auth.workspace.id + '/Items').add({
      name: name,
      desc: desc,
      tags: tags,
      locations: [location],
      category: category,
      imageUrl: imageUrl
    });

    return of(true);
  }

  removeItem(itemID: number) {
    this.afs.doc<Item>('/Workspaces/' + this.auth.workspace.id + '/Items/' + itemID).delete();
    return of(true);
  }

  updateHierarchyPosition(parentID: number, moveID: number) {
    throw new Error('Method not implemented.');
  }

  constructor(private afs: AngularFirestore, private auth: AuthService) {
    // this.createItemAtLocation("Pizza Frank", "A pizza named Frank", ["Pizza", "Frank"],"FqYPTX6TfHKfWtaTJ7FS","https://cdn.discordapp.com/attachments/216020806587645954/681427611221884938/PizzaFrank.png","66RbfJWe0GA0AyU37v7a")
  }
}
