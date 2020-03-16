//adapted from https://angular.io/guide/component-interaction#!#bidirectional-service
//  and from: https://www.reddit.com/r/Angular2/comments/4qhumr/communication_between_navbar_and_pages/?sort=confidence

import { Injectable } from '@angular/core';
import {Subject, BehaviorSubject} from 'rxjs';
import { HierarchyItem } from '../models/HierarchyItem';

@Injectable({
  providedIn: 'root'
})
export class NavService {
  /**Delete message passer */
  deleteMessage: BehaviorSubject<boolean> = new BehaviorSubject(false);

  private returnClick: BehaviorSubject<boolean> = new BehaviorSubject(false); //emitter for return clicked

  /**The current parent reference, used to hold reference between screens*/
  private parentRaw: HierarchyItem;

  /**Type of search, used to hold reference between screens */
  private searchTypeRaw: string;

  /**Parent behavior, used for interop between navbar and search */
  private parent: BehaviorSubject<HierarchyItem> = new BehaviorSubject(null);

  /**Search type behavior, used for interop between navbar and search */
  private searchType: BehaviorSubject<string> = new BehaviorSubject('');

  constructor() { }

  /**Getter for parent subscription */
  getParent(){
    return this.parent.asObservable();
  }

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

  /**Gets return state observable */
  getReturnState(){
    return this.returnClick.asObservable();
  }

  returnState(){
    console.log('returned');
    this.returnClick.next(true);
  }

  /**Getter for search type */
  getSearchType(){
    return this.searchType.asObservable();
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

    /**
   * Sends delete message
   */
  setDelete(){
    this.deleteMessage.next(true);
  }

  /**
   * Returns the delete message passer
   */
  getDeleteMessage(){
    return this.deleteMessage;
  }

  /**
   * Resets delete message
   */
  resetDelete(){
    this.deleteMessage.next(false);
  }
}
