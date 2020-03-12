import { Injectable } from '@angular/core';
import {Observable, of} from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ImageMockService {

  constructor() { }

  getImage(ID: string): Observable<string> {

    // If it's already a firestorage URL, then don't poll for one
    if (ID.substring(0, 5) === 'gs://') { return; }

    return of('https://crouton.net/crouton.png');
  }
}
