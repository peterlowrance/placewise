import { Injectable } from '@angular/core';
import { AuthService } from './auth.service';
import {AngularFirestore} from '@angular/fire/firestore';
import * as firebase from 'firebase';
import { PrintItem } from '../models/PrintItem';
import { U } from '@angular/cdk/keycodes';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { PrintTemplate } from '../models/PrintTemplate';



@Injectable({
    providedIn: 'root'
})

export class PrintService {

    constructor(private afs: AngularFirestore, private auth: AuthService){ }

    addPrintItemToQueue(workspaceID: string, printItem: PrintItem){
        this.afs.doc('/Workspaces/' + workspaceID + '/WorkspaceUsers/' + this.auth.userInfo.value.id)
            .update({printQueue: firebase.firestore.FieldValue.arrayUnion(printItem)});
    }


    getItemsInQueue(workspaceID: string, userID: string): Observable<PrintItem[]> {
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

    async getPrintTemplates(workspaceID: string): Promise<PrintTemplate[]> {
        let templates = await this.afs.doc('/Workspaces/' + workspaceID + '/StructureData/PrintTemplates').ref.get();
        if(templates.exists){
            const data = templates.data().templates as PrintTemplate[];
            if(data){
                return data;
              }
              else {
                return null;
              }
        }
    }

    // Checks if the template name already exists. If so, it will overwrite the template. Otherwise, it will make a new version.
    // Returns true once it's saved.
    saveNewTemplate(workspaceID: string, originalTemplates: PrintTemplate[], newTemplate: PrintTemplate): Promise<boolean> {
        
        return new Promise<boolean>((resolve) => {
        
            let templateOverriden = false;
            
            for(let template of originalTemplates){
                if(template.templateName.toUpperCase() === newTemplate.templateName.toUpperCase()){
                    template = newTemplate;
                    templateOverriden = true;
                    break;
                }
            }

            // Put new templates at the top
            if(!templateOverriden){
                originalTemplates = [newTemplate].concat(originalTemplates);
            }

            this.afs.doc('/Workspaces/' + workspaceID + '/StructureData/PrintTemplates')
                .set({templates: originalTemplates}).then(resolved => {
                    resolve(true);
                })

        });
    }


}