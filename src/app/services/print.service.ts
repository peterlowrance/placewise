import { Injectable } from '@angular/core';
import { AuthService } from './auth.service';
import {AngularFirestore} from '@angular/fire/firestore';
import * as firebase from 'firebase';
import { PrintItem } from '../models/PrintItem';
import { U } from '@angular/cdk/keycodes';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';



@Injectable({
    providedIn: 'root'
})

export class PrintService {

    constructor(private afs: AngularFirestore, private auth: AuthService){ }

    addPrintItemToQueue(workspaceID: string, printItem: PrintItem){
        this.afs.doc('/Workspaces/' + workspaceID + '/WorkspaceUsers/' + this.auth.userInfo.value.id)
            .update({printQueue: firebase.firestore.FieldValue.arrayUnion(printItem)});
    }


    subscribeToItemsInQueue(workspaceID: string, userID: string): Observable<PrintItem[]> {
        return this.afs.doc('/Workspaces/' + workspaceID + '/WorkspaceUsers/' + userID).snapshotChanges().pipe(map(a => {
            const data = a.payload.data() as {printQueue: PrintItem[]};
            if(data){
                return data.printQueue;
            }
            else {
                return null;
            }
        }));
    }

    async updateItemsInQueue(workspaceID: string, printQueue: PrintItem[]){
        this.afs.doc('/Workspaces/' + workspaceID + '/WorkspaceUsers/' + this.auth.userInfo.value.id)
            .update({printQueue: printQueue});
    }

}