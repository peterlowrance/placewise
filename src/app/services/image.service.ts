import { Injectable } from '@angular/core';
import { AngularFireStorage, AngularFireUploadTask } from '@angular/fire/storage';
import { AuthService } from './auth.service';
import {AngularFirestore} from '@angular/fire/firestore';
import {Observable} from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ImageService {

  constructor(private afsg: AngularFireStorage, private auth: AuthService) { }

  getImage(ID: string): Observable<string> {

    // If it's already a firestorage URL, then don't poll for one
    if (ID && ID.substring(0, 5) === 'gs://') { return; }

    return this.afsg.ref(this.auth.workspace.id + '/' + ID).getDownloadURL();
  }
}
