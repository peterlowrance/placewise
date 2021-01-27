// import { AdminInterfaceService } from './admin-interface.service';

import {Injectable} from '@angular/core';
import {HttpHeaders} from '@angular/common/http';
import {Observable, of} from 'rxjs';
import {Item} from '../models/Item';
import {SentReport} from '../models/SentReport';
import {Report} from '../models/Report';
import { User } from '../models/User';

interface UserData{
  user: User;
  role: string;
}

/**
 * NOTE: all requests to change users will only work for Anna Bray, all others will fail
 */

const TESTDATA: UserData[] = [
  {user: {firstName:"Anna",lastName:"Bray",email:"abray@gamil.com", workspace:"aP87kgghQ8mqvvwcZGQV", id:"11111"}, role:"User"}, 
  {user: {firstName:"Lord",lastName:"Saladin",email:"headbutt@yahoo.com", workspace: "aP87kgghQ8mqvvwcZGQV", id:"11112"}, role:"User"}, 
  {user: {firstName:"Cayde",lastName:"Six",email:"fastmouth@gamil.com", workspace: "aP87kgghQ8mqvvwcZGQV", id:"11113"}, role:"Admin"}
]

@Injectable({
  providedIn: 'root'
})
export class AdminMockService {
  placeReport(itemID: string, text: string): Observable<boolean> {
    return of(true);
  }

  getReports(): Observable<SentReport[]> {
    const trueItem: Item = {name: 'test', fullTitle: 'test', ID: '1', locations: [], category: 'cat'};
    const report: SentReport = {item: 'I1', desc: 'an item', user: 'aP87kgghQ8mqvvwcZGQV', sentTo: ['no'], ID: '1', trueItem, userName: 'Bobbo', timestamp: 0};
    return of([report]);
  }

  updateItem(item: Item): Observable<boolean> {
    return of(true);
  }

  createItem(item: Item): Observable<boolean> {
    return of(true);
  }

  createItemAtLocation(name: string, desc: string, tags: string[], category: string, imageUrl: string, location: string): Observable<boolean> {
    return of(true);
  }

  removeItem(itemID: number) {
    return of(true);
  }

  updateHierarchyPosition(parentID: number, moveID: number) {
    throw new Error('Method not implemented.');
  }

  /**
   * Gets the workspace users
   */
  getWorkspaceUsers(){
    return of(TESTDATA);
  }

  /**
   * Sets the user role, 
   * @param email 
   * @param role 
   */
  setUserRole(email:string, role:string){
    console.log(email);
    if(email === "abray@gamil.com") return of(role).toPromise();
    else return new Promise<{user:User, role:string}>((resolve, reject) => reject('ERROR'));
  }

  addUserToWorkspace(email:string, firstName:string, lastName:string): Promise<{user:User, role:string}>{
    if(email === 'abray@gamil.com') return of(TESTDATA[0]).toPromise();
    else return new Promise<{user:User, role:string}>((resolve, reject) => reject('ERROR'));
  }

  deleteUserByEmail(email: string){
    if(email === "abray@gamil.com") return new Promise<{user:User, role:string} | void>((resolve, reject) => resolve());
    else return new Promise<{user:User, role:string}>((resolve, reject) => reject('ERROR'));
  }

  constructor() {}
}
