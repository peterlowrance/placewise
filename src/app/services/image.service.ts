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

  getImage(ID: string): Observable<any> {
    return this.afsg.ref(this.auth.workspace.id + '/' + ID).getDownloadURL();
  }
}
