import { Injectable } from '@angular/core';
import {Router} from '@angular/router';
import { AngularFireAuth } from '@angular/fire/auth';
import {AngularFirestore} from '@angular/fire/firestore';
import {of, BehaviorSubject} from 'rxjs';
import {WorkspaceInfo} from '../models/WorkspaceInfo';
import {User} from '../models/User';
import * as firebase from 'firebase';

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
export class AuthService {
  /** User workspace information */
  workspace: WorkspaceInfo = {
    name: '',
    id: ''
  };
  /** User information */
  userInfo: User = {
    firstName: '',
    lastName: '',
    email: '',
    workspace:''
  }
  /**User role, Admin or User */
  role: string;

  currentRole: BehaviorSubject<string> = new BehaviorSubject<string>(this.role);

  constructor(private afAuth: AngularFireAuth,
              private afs: AngularFirestore,
              private router: Router) {

                //onauthstatechange, update credentials
                afAuth.auth.onAuthStateChanged((user) => this.updateUserInformation(user));
  }

  /**
   * Updates user information when auth state changes
   * @param user The user info retrieved from onAuthStateChanged
   */
  updateUserInformation(user: firebase.User){
    if(user){
      user.getIdTokenResult().then(token => {
        this.workspace.id = token.claims.workspace;
        this.role = token.claims.role;
        console.log(token.claims);
        const workDoc = this.getWorkspaceInfo(token.claims.workspace);
        //subscribe to changes in workspace name
        workDoc.subscribe(
          val => this.workspace.name = val.name
        );
      });
      const userDoc = this.getUserInfo(user.uid);
      //subscribe to changes in user info
      userDoc.subscribe(
        val => this.userInfo = val
      );
    }
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
      //try to log in
      this.afAuth.auth.signInWithEmailAndPassword(email,password)
      .then(userData => resolve(),
      //error occured in sign-in, reject attempt
      err => reject(err)
      );
    })
  }

  /**
   * Gets the workspace information from firebase
   * @param workspace the workspace id
   */
  private getWorkspaceInfo(workspace: string){
    return this.afs.doc<Workspace>(`Workspaces/${workspace}`).valueChanges();
  }

  /**
   * Gets user information from firebase
   * @param uid unique firebase user id
   */
  private getUserInfo(uid: string){
    return this.afs.doc<User>(`Users/${uid}`).valueChanges();
  }

  /**
   * Logs out of Firebase
   */
  logout(){
    this.afAuth.auth.signOut();
    this.router.navigate(['/login']);
  }

  /**
   * Gets the authentication state
   */
  getAuth(){
    return this.afAuth.authState;
  }

  /**
   * Gets the user information
   */
  getUser(){
    return of(this.userInfo);
  }

  /**
   * Gets the workspace information
   */
  getWorkspace(){
    return of(this.workspace);
  }

  /**
   * Gets the role of the user
   */
  getRole(){
    return of(this.role);
  }

  getRoleCurrent(){
    return this.currentRole.asObservable();
  }

  /**
   * Sends a reset password email with the given email
   */
  sendPasswordResetEmail(email: string){
    return this.afAuth.auth.sendPasswordResetEmail(email);
  }

  /**
   * Sends a change password request to firebase
   */
  async changePassword(curPass: string, newPass: string){
    const cred = firebase.auth.EmailAuthProvider.credential(this.userInfo.email, curPass);
    //reauthenticate
    await this.afAuth.auth.currentUser.reauthenticateWithCredential(cred);
    return await this.afAuth.auth.currentUser.updatePassword(newPass);
  }
}
