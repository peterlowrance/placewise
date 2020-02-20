import { Injectable } from '@angular/core';
import {Router} from '@angular/router';
import { AngularFireAuth } from '@angular/fire/auth';
import {AngularFirestore, AngularFirestoreDocument} from '@angular/fire/firestore';
import {Observable, of, BehaviorSubject} from 'rxjs';
import {first, map} from 'rxjs/operators';
import {WorkspaceInfo} from '../models/WorkspaceInfo';
import {User} from '../models/User';

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
    email: ''
  }
  /**User role, Admin or User */
  role: string;

  _workspace: BehaviorSubject<WorkspaceInfo> = new BehaviorSubject(this.workspace);
  _userInfo: BehaviorSubject<User> = new BehaviorSubject(this.userInfo);
  _role: BehaviorSubject<string> = new BehaviorSubject(this.role);

  constructor(private afAuth: AngularFireAuth,
              private afs: AngularFirestore,
              private router: Router) { }

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
      .then(userData => {
        //success, get user info
        const doc = this.ensureUserInWorkspace(workspace, userData.user.uid);
        if(doc){ //user is in DB, get information for authentication
          doc.subscribe(
            val => {this.role = val.role; this._role.next(this.role);}
          );

          //get workspace name
          const workDoc = this.getWorkspaceInfo(workspace);
          //if work is null, workspace is nonexistant (redundent, but in case of drops)
          if(!workDoc) reject("Could not query workspace information");
          //subscribe to changes in workspace name
          workDoc.subscribe(
            val => {this.workspace.name = val.name; this._workspace.next(this.workspace);}
          );
          //can also set workspace id
          this.workspace.id = workspace;

          //now get user information, again might be nonexistant if a drop occurs
          const userDoc = this.getUserInfo(userData.user.uid);
          if(!userDoc) reject("Could not query user information");
          //subscribe to changes in user info
          userDoc.subscribe(
            val => {this.userInfo = val; this._userInfo.next(val);}
          );
          //have all info, can quit
          resolve(userData);
        } else  { //user-workspace connect problem
          //logout and reject
          this.logout();
          reject("User does not belong to this workspace or the workspace does not exist.");
        }
      },
      //error occured in sign-in, reject attempt
      err => reject(err)
      );
    })
  }

  /**
   * Ensures a user is in the current workspace
   * @param workspace Workspace ID trying to sign into
   * @param uid: User ID trying to sign in
   * @returns A boolean if the user is in the given workspace
   */
  private ensureUserInWorkspace(workspace: string, uid: string){
    return this.afs.doc<WorkspaceUser>(`Workspaces/${workspace}/WorkspaceUsers/${uid}`).valueChanges();
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
    return this._userInfo.asObservable();
  }

  /**
   * Gets the workspace information
   */
  getWorkspace(){
    return this._workspace.asObservable();
  }

  /**
   * Gets the role of the user
   */
  getRole(){
    return this._role.asObservable();
  }
}
