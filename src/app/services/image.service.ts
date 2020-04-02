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

  putImage(file: File, itemID: string): Observable<string>{
    //get blob ref
    const ref = this.afsg.ref(this.auth.workspace.id + '/' + itemID);
    return new Observable(obs => {
      // Put the file
      ref.put(file).then(f => {
        // After it's put, return its url
        ref.getDownloadURL().subscribe(url => {
          obs.next(url);
          obs.complete();
        });
      });
    });
  }

  removeImage(itemID: string): Promise<any>{
    //get ref
    const ref = this.afsg.ref(this.auth.workspace.id + '/' + itemID);
    //erase
    return ref.delete().toPromise();
  }
}
