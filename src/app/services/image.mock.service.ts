import { Injectable } from '@angular/core';
import {Observable, of} from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ImageMockService {

  constructor() { }

  /*async putImage(file: File, itemID: string): Observable<string> {
    let ret = 'https://crouton.net/crouton.png'
    return of(ret).toPromise();
  }*/
}
