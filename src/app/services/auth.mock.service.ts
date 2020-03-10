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


const EXPECTED_TEST_CREDENTIALS = {
  email: 'correct@correct.com',
  password: 'correctPassword',
  workspace: ''
};

const MOCK_USER: User = {
  firstName: 'USER',
  lastName: 'McUSER',
  email: 'correct@correct.com',
}

const MOCK_WORKSPACE: WorkspaceInfo = {
  name: 'WORKSPACE',
  id: '000111000'
};

let MOCK_ROLE = 'Admin';

let changeRoll = () => 
  MOCK_ROLE = MOCK_ROLE === 'Admin' ? 'User' : 'Admin';

let loggedIn = false;

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

  constructor() {
                //onauthstatechange, update credentials

               }

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
          resolve();
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
    return new Promise((reject, resolve) => {
      if(email === MOCK_USER.email) resolve();
      else reject();
    })
  }

  /**
   * Sends a change password request to firebase
   */
  changePassword(curPass: string, newPass: string){
    return new Promise((reject, resolve) => {
      if(curPass === EXPECTED_TEST_CREDENTIALS.password) resolve();
      else reject();
    })
  }
}
