import { Injectable } from '@angular/core';
import { AngularFireStorage, AngularFireUploadTask } from '@angular/fire/storage';
import { AuthService } from './auth.service';
import {AngularFirestore} from '@angular/fire/firestore';
import {EMPTY, Observable, of} from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ImageService {

  constructor(private afsg: AngularFireStorage, private auth: AuthService) { }

  async putImage(file: File, itemID: string): Promise<string>{
    //get blob ref
    const ref = this.afsg.ref(this.auth.workspace.id + '/' + itemID);
    //put
    await ref.put(file);
    //return new link
    return ref.getDownloadURL().toPromise();
  }

  removeImage(itemID: string): Promise<any>{
    //get ref
    const ref = this.afsg.ref(this.auth.workspace.id + '/' + itemID);
    //erase
    return ref.delete().toPromise();
  }
}
