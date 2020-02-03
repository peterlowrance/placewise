//adapted from https://angular.io/guide/component-interaction#!#bidirectional-service
//  and from: https://www.reddit.com/r/Angular2/comments/4qhumr/communication_between_navbar_and_pages/?sort=confidence

import { Injectable } from '@angular/core';
import {Subject} from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class NavService {

  private navStateSource = new Subject<string>();
  navState = this.navStateSource.asObservable();

  constructor() { }

  setNavBarState( state: string ) {
    this.navStateSource.next( state );
  }
}
