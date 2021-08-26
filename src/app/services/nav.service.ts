//adapted from https://angular.io/guide/component-interaction#!#bidirectional-service
//  and from: https://www.reddit.com/r/Angular2/comments/4qhumr/communication_between_navbar_and_pages/?sort=confidence

import { Injectable } from '@angular/core';
import {Subject, BehaviorSubject, Observable, Subscribable, Subscription} from 'rxjs';
import { HierarchyItem } from '../models/HierarchyItem';

@Injectable({
  providedIn: 'root'
})
export class NavService {
  /**Delete message passer */
  deleteMessage: BehaviorSubject<boolean> = new BehaviorSubject(false);

  private returnClick: BehaviorSubject<boolean> = new BehaviorSubject(false); //emitter for return clicked

  /**Type of search, used to hold reference between screens */
  private searchTypeRaw: string;

  private isDirty: boolean = false;

  /**Parent behavior, used for interop between navbar and search */
  private parent: BehaviorSubject<HierarchyItem> = new BehaviorSubject(null);
  private subscribedParent: Subscription;

  /**Search type behavior, used for interop between navbar and search */
  private searchType: BehaviorSubject<string> = new BehaviorSubject('');

  constructor() { }

  /**Getter for parent subscription */
  getParent(){
    return this.parent.asObservable();
  }

  /**An event to send to the nav service, telling it to forget its state */
  forgetParent(){
    this.parent.next(null);
  }

  setParent(newParent: HierarchyItem){
    if(this.subscribedParent) this.subscribedParent.unsubscribe();
    this.parent.next(newParent);
  }

  /** If we want a screen to stay updated, we can use this */
  setSubscribedParent(newParent: Observable<HierarchyItem>){
    if(this.subscribedParent) this.subscribedParent.unsubscribe();
    this.subscribedParent = newParent.subscribe(updatedParent => {
      console.log(updatedParent);
      this.parent.next(updatedParent);
    })
  }

  /**Gets return state observable */
  getReturnState(){
    return this.returnClick.asObservable();
  }

  returnState(){
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

  setDirty(value: boolean){
    this.isDirty = value;
  }

  getDirty(): boolean {
    return this.isDirty;
  }
}
