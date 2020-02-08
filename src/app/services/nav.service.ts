//adapted from https://angular.io/guide/component-interaction#!#bidirectional-service
//  and from: https://www.reddit.com/r/Angular2/comments/4qhumr/communication_between_navbar_and_pages/?sort=confidence

import { Injectable } from '@angular/core';
import {Subject, BehaviorSubject} from 'rxjs';
import { HierarchyItem } from '../models/HierarchyItem';

@Injectable({
  providedIn: 'root'
})
export class NavService {

  private navStateSource = new Subject<string>(); //state subject
  navState = this.navStateSource.asObservable();  //observable for state

  returnClick: BehaviorSubject<boolean> = new BehaviorSubject(false); //emitter for return clicked

  /**The current parent reference, used to hold reference between screens*/
  private parentRaw: HierarchyItem;

  /**Type of search, used to hold reference between screens */
  private searchTypeRaw: string;

  /**Parent behavior, used for interop between navbar and search */
  parent: BehaviorSubject<HierarchyItem> = new BehaviorSubject(null);

  /**Search type behavior, used for interop between navbar and search */
  searchType: BehaviorSubject<string> = new BehaviorSubject('');

  constructor() { }

  /**An event to send to the nav service, telling it to forget its state */
  forgetParent(){
    this.parentRaw = null;
    this.parent.next(null);
  }

  /**Setter for parent state */
  setParent(newParent: HierarchyItem){
    this.parentRaw = newParent;
    this.parent.next(newParent);
  }

  setNavBarState( state: string ) {
    this.navStateSource.next( state );
  }

  returnState(){
    this.returnClick.next(true);
  }

  /**Forgets the search type */
  forgetSearchType(){
    this.searchTypeRaw = '';
    this.searchType.next('');
  }

  /**Setter for search type */
  setSearchType(type: string){
    this.searchTypeRaw = type;
    this.searchType.next(type);
  }
}
