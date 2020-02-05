import { Injectable } from '@angular/core';
import {Router} from '@angular/router';
import { AngularFireAuth } from '@angular/fire/auth';
import {AngularFirestore, AngularFirestoreDocument} from '@angular/fire/firestore';
import {Observable, of} from 'rxjs';
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
  
  //public getters
  workspace: WorkspaceInfo = {
    name: '',
    id: ''
  };
  userInfo: User = {
    firstName: '',
    lastName: '',
    email: ''
  }
  role: string;

  constructor(private afAuth: AngularFireAuth,
              private afs: AngularFirestore,
              private router: Router) { }

  login(email: string, password: string, workspace: string){
    return new Promise((resolve, reject) => {
      this.afAuth.auth.signInWithEmailAndPassword(email,password)
      .then(userData => {
        const doc = this.ensureUserInWorkspace(workspace, userData.user.uid);
           
        if(doc){ //user is in DB, get information for authentication
          doc.subscribe(
            val => {
              this.role = val.role;
            }
          );
          //get workspace name
          const workDoc = this.getWorkspaceInfo(workspace);

          //if work is null, workspace is nonexistant (redundent, but in case of drops)
          if(!workDoc) reject("Could not query workspace information");

          workDoc.subscribe(
            val => this.workspace.name = val.name
          );

          //can also set workspace id
          this.workspace.id = workspace;

          //now get user information, again might be nonexistant if a drop occurs
          const userDoc = this.getUserInfo(userData.user.uid);

          if(!userDoc) reject("Could not query user information");

          userDoc.subscribe(
            val => this.userInfo = val
          );

          resolve(userData);
        } else  {
          this.logout();
          reject("User does not belong to this workspace or the workspace does not exist.");
        }
        // resolve(userData)
      },
      err => reject(err)
      );
    })
    // ).then(
    //   userData => {
    //   const doc = this.ensureUserInWorkspace(workspace, userData.user.uid)
    //       doc.subscribe(val => {
    //         console.log(val);
    //       })
    //       if(doc){
    //         resolve(userData);
    //       } else  {
    //         this.logout();
    //         reject("User does not belong to this workspace or the workspace does not exist.");
    //       }
    //   }
    // )
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
    return of(this.userInfo);
  }

  /**
   * Gets the workspace information
   */
  getWorkspace(){
    return of(this.workspace);
  }
}
