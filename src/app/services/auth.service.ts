import { Injectable } from '@angular/core';
import {Router} from '@angular/router';
import { AngularFireAuth } from '@angular/fire/auth';
import {AngularFirestore} from '@angular/fire/firestore';
import {of, BehaviorSubject} from 'rxjs';
import {WorkspaceInfo} from '../models/WorkspaceInfo';
import {User} from '../models/User';
import * as firebase from 'firebase';
import { WorkspaceUser } from '../models/WorkspaceUser';

interface Workspace{
  Items: any;
  Category: any;
  Locations: any;
  Reports: any;
  WorkspaceUsers: any;
  name: string;
  defaultUsersForReports: string[];
};

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  /** User workspace information */
  workspace: WorkspaceInfo = {
    name: '',
    id: '',
    defaultUsersForReports: []
  };
  /** User information */
  userInfo: User = {
    firstName: '',
    lastName: '',
    email: '',
    workspace:'',
    id: ''
  }
  /**User role, Admin or User */
  role: string = 'User';

  /**Current role behavior subject */
  currentRole: BehaviorSubject<string> = new BehaviorSubject<string>(this.role);;

  /**Workspace behaviour subject */
  currentWorkspace: BehaviorSubject<WorkspaceInfo> = new BehaviorSubject<WorkspaceInfo>(this.workspace);

  // TEMPORARY - Will be changed after some major refactoring for how information is looaded in memory
  usersInWorkspace = 0;

  // If this user has recieve emails turned on
  recieveEmails: boolean;

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
        //set raw workspace and role
        this.workspace.id = token.claims.workspace;
        this.role = token.claims.role;

        //set behavior subject workspace and role
        this.currentWorkspace.next(this.workspace);
        this.currentRole.next(this.role);
        
        //get info
        const workDoc = this.getWorkspaceInfo(this.workspace.id);
        //subscribe to changes in workspace name, re-ping current workspace
        workDoc.subscribe(
          val => {
            this.workspace.name = val.name; 
            this.workspace.defaultUsersForReports = val.defaultUsersForReports
            this.currentWorkspace.next(this.workspace);
          }
        );

        // TEMPORARY - Will be changed or removed when refactoring
        this.afs.collection(`Workspaces/${this.workspace.id }/WorkspaceUsers`).get().subscribe(col => {
          this.usersInWorkspace = col.size;
        })

        // ALSO KINDA TEMPORARY EHH
        this.afs.doc(`Workspaces/${this.workspace.id}/WorkspaceUsers/${user.uid}`).snapshotChanges().subscribe(wUser => {
          this.recieveEmails = (wUser.payload.data() as WorkspaceUser).emailReports;
        });
      });
      const userDoc = this.getUserInfo(user.uid);
      //subscribe to changes in user info
      userDoc.subscribe(
        val => {this.userInfo = val; this.userInfo.id = user.uid}
      );
    }
    else{ //user not defined, set behavior subjects to null
      this.currentRole.next(null);
      this.currentWorkspace.next(null);
    }
  }
  
  /**
   * Logs into firebase through email and password sign-in method, retrieves
   * auth, workspace info, and user info authentication fields
   * @param email The email used to sign into firebase workspace
   * @param password The password associated with this email
   * @param workspace The workspace ID corresponding to the workspace the user is trying to sign into
   */
  login(email: string, password: string){
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
   * !!! WARNING !!!: This currently does not include the id in the User object
   * 
   * @param uid unique firebase user id
   */
  getUserInfo(uid: string){
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
    return this.currentWorkspace.asObservable();
  }

  /**
   * Gets the role of the user
   */
  getRole(){
    return this.currentRole.asObservable();
  }

  getRecieveEmails(){
    return of(this.recieveEmails);
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
