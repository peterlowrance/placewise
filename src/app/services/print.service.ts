import { Injectable } from '@angular/core';
import { AuthService } from './auth.service';
import {AngularFirestore} from '@angular/fire/firestore';
import * as firebase from 'firebase';
import { PrintItem } from '../models/PrintItem';
import { U } from '@angular/cdk/keycodes';



@Injectable({
    providedIn: 'root'
})

export class PrintService {

    constructor(private afs: AngularFirestore, private auth: AuthService){ }

    addPrintItemToQueue(workspaceID: string, printItem: PrintItem){
        this.afs.doc('/Workspaces/' + workspaceID + '/WorkspaceUsers/' + this.auth.userInfo.value.id)
            .update({printQueue: firebase.firestore.FieldValue.arrayUnion(printItem)});
    }


    async loadItemsInQueue(workspaceID: string, userID: string): Promise<PrintItem[]> {
        let workspaceUserData = await this.afs.doc('/Workspaces/' + workspaceID + '/WorkspaceUsers/' + userID).ref.get();
        if(workspaceUserData.exists){
            const data = workspaceUserData.data() as {printQueue: PrintItem[]};
            if(data){
                return data.printQueue;
            }
            else {
                return null;
            }
        }
    }

}