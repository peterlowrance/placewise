import { Injectable } from '@angular/core';
import {Router} from '@angular/router';
import { AngularFireAuth } from '@angular/fire/auth';
import {AngularFirestore, AngularFirestoreDocument} from '@angular/fire/firestore';
import {Observable, of} from 'rxjs';
import {first, map} from 'rxjs/operators';
import {WorkspaceInfo} from '../models/WorkspaceInfo';
import {User} from '../models/User';
import * as firebase from 'firebase';
import { $ } from 'protractor';


export const EXPECTED_TEST_CREDENTIALS = {
  email: 'correct@correct.com',
  password: 'correctPassword',
  workspace: '000111000'
};

export const MOCK_USER: User = {
  firstName: 'USER',
  lastName: 'McUSER',
  email: 'correct@correct.com',
}

export const MOCK_WORKSPACE: WorkspaceInfo = {
  name: 'WORKSPACE',
  id: '000111000'
};

export let MOCK_ROLE = 'Admin';

export let changeRoll = () => 
  MOCK_ROLE = MOCK_ROLE === 'Admin' ? 'User' : 'Admin';

export let loggedIn = false;

export let updatedPass:string = null;

interface WorkspaceUser{
  role: string;
  userRef: any;
};

interface Workspace{
  Items: any;
  Category: any;
  Locations: any;
  Reports: any;
  WorkspaceUsers: any;
  name: string;
};

@Injectable({
  providedIn: 'root'
})
export class AuthMockService {

  /**User role, Admin or User */
  role: string;

  constructor() {}

  /**
   * Logs into firebase through email and password sign-in method, retrieves
   * auth, workspace info, and user info authentication fields
   * @param email The email used to sign into firebase workspace
   * @param password The password associated with this email
   * @param workspace The workspace ID corresponding to the workspace the user is trying to sign into
   */
  login(email: string, password: string, workspace: string){
    //promise return login
    return new Promise((resolve, reject) => {
      if(email === EXPECTED_TEST_CREDENTIALS.email
        && password === EXPECTED_TEST_CREDENTIALS.password
        && workspace === EXPECTED_TEST_CREDENTIALS.workspace){
          loggedIn = true;
          resolve('LOGGED-IN');
        }
        else reject('LOG-IN ERROR');
    })
  }

  /**
   * Logs out of Firebase
   */
  logout(){
    loggedIn = false;
  }

  /**
   * Gets the authentication state
   */
  getAuth(){
    if(loggedIn) return of({});
    return of(null);
  }

  /**
   * Gets the user information
   */
  getUser(){
    return of(MOCK_USER);
  }

  /**
   * Gets the workspace information
   */
  getWorkspace(){
    return of(MOCK_WORKSPACE);
  }

  /**
   * Gets the role of the user
   */
  getRole(){
    return of(MOCK_ROLE);
  }

  /**
   * Sends a reset password email with the given email
   */
  sendPasswordResetEmail(email: string){
    return new Promise((resolve, reject) => {
      if(email == MOCK_USER.email) return resolve();
      else return reject('failure');
    })
  }

  /**
   * Sends a change password request to firebase
   */
  changePassword(curPass: string, newPass: string){
    return new Promise((resolve, reject) => {
      if(curPass === EXPECTED_TEST_CREDENTIALS.password){
        updatedPass = newPass;
        return resolve();
      }
      else return reject('err');
    })
  }
}
