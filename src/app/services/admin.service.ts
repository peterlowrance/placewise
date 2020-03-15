// import { AdminInterfaceService } from './admin-interface.service';

import {Injectable} from '@angular/core';
import {HttpHeaders} from '@angular/common/http';
import {Observable, of} from 'rxjs';
import {Item} from '../models/Item';
import {AngularFirestore} from '@angular/fire/firestore';
import {AuthService} from './auth.service';
import {SentReport} from '../models/SentReport';
import {map} from 'rxjs/operators';
import { HierarchyItem } from '../models/HierarchyItem';
declare var require: any

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
      user: this.auth.userInfo.firstName
    });

    return of(true);
  }

  getReports(): Observable<SentReport[]> {
    return this.afs.collection<SentReport>('/Workspaces/' + this.auth.workspace.id + '/Reports').snapshotChanges().pipe(map(a => {
      return a.map(g => {
          const data = g.payload.doc.data() as SentReport;
          data.ID = g.payload.doc.id;
          return data;
        }
      );
    }));
  }

  updateItem(item: Item): Observable<boolean> {
    this.afs.doc<Item>('/Workspaces/' + this.auth.workspace.id + '/Items/' + item.ID).set(item);
    return of(true);
  }

  createItem(item: Item){
    return this.afs.collection('/Workspaces/' + this.auth.workspace.id + '/Items').add({
      item
    }).then(
      val => {
        for(let i = 0; i < item.locations.length; i++)
        {
          this.afs.doc<HierarchyItem>('/Workspaces/' + this.auth.workspace.id + '/Locations/' + item.locations[i]).get().pipe(
            map( doc => doc.data())
          ).toPromise().then(
            doc => {
              let ary = (typeof doc.items === 'undefined' || doc.items === null) ? [] : doc.items;
              ary.push(val.id);
              this.afs.doc('Workspaces/' + this.auth.workspace.id + '/Locations/' + item.locations[i]).update({items: ary})
            }
          )
        }
      }
    );
  }

  createItemAtLocation(name: string, desc: string, tags: string[], category: string, imageUrl: string, location: string){
    return this.afs.collection('/Workspaces/' + this.auth.workspace.id + '/Items').add({
      name: name,
      desc: desc,
      tags: tags,
      locations: [location],
      category: category,
      imageUrl: imageUrl
    }).then(
      val => {
        this.afs.doc<HierarchyItem>('/Workspaces/' + this.auth.workspace.id + '/Locations/' + location).get().pipe(
          map( doc => doc.data())
        ).toPromise().then(
          doc => {
            let ary = (typeof doc.items === 'undefined' || doc.items === null) ? [] : doc.items;
            ary.push(val.id);
            this.afs.doc('Workspaces/' + this.auth.workspace.id + '/Locations/' + location).update({items: ary})
          }
        )
      }
    );

    return of(true);
  }

  removeItem(itemID: number) {
    this.afs.doc<Item>('/Workspaces/' + this.auth.workspace.id + '/Items/' + itemID).delete();
    return of(true);
  }

  updateHierarchyPosition(parentID: number, moveID: number) {
    throw new Error('Method not implemented.');
  }

  updateLocationPosition(parentID: string, moveID: string) {
    var loc : HierarchyItem;
    this.afs.doc<HierarchyItem>('/Workspaces/' + this.auth.workspace.id + '/Locations/' + moveID).get().subscribe(doc => console.log(doc.data))
    let oldParent = loc.parent;
    //update new parent id
    this.afs.doc<HierarchyItem>('/Workspaces/' + this.auth.workspace.id + '/Locations/' + moveID).update({
      parent: parentID
    })
    //remove from old parent's child list
    this.afs.doc<HierarchyItem>('/Workspaces/' + this.auth.workspace.id + '/Locations/' + oldParent).get().pipe(
      map( doc => doc.data())
    ).toPromise().then(
      doc => {
        let ary = (typeof doc.children === 'undefined' || doc.children === null) ? [] : doc.children;
        ary.remove(moveID);
        this.afs.doc('Workspaces/' + this.auth.workspace.id + '/Locations/' + oldParent).update({children: ary})
      }
    )
    //Add to new parent's list
    this.afs.doc<HierarchyItem>('/Workspaces/' + this.auth.workspace.id + '/Locations/' + parentID).get().pipe(
      map( doc => doc.data())
    ).toPromise().then(
      doc => {
        let ary = (typeof doc.children === 'undefined' || doc.children === null) ? [] : doc.children;
        ary.push(moveID);
        this.afs.doc('Workspaces/' + this.auth.workspace.id + '/Locations/' + parentID).update({children: ary})
      }
    )
  }

  addLocation(newitem : HierarchyItem)
  {
    
  }

  updateCategoryPosition(parentID: number, moveID: number) {
    throw new Error('Method not implemented.');
  }

  constructor(private afs: AngularFirestore, private auth: AuthService) {
    this.updateLocationPosition("K1l2fRAzAoz3hJsx6qHF","WzEIS9CQyRlB34s68Bfv");
    // this.createItemAtLocation("Pizza Frank", "A pizza named Frank", ["Pizza", "Frank"],"FqYPTX6TfHKfWtaTJ7FS","https://cdn.discordapp.com/attachments/216020806587645954/681427611221884938/PizzaFrank.png","66RbfJWe0GA0AyU37v7a")
  }
}
