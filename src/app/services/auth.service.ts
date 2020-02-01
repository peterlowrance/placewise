import { Injectable } from '@angular/core';
import { AngularFireAuth } from '@angular/fire/auth';
import {AngularFirestore, AngularFirestoreDocument} from '@angular/fire/firestore'
import {Observable} from 'rxjs';
import {first} from 'rxjs/operators'

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  constructor(private afAuth: AngularFireAuth,
              private afs: AngularFirestore) { }

  login(email: string, password: string, workspace: string){
    return new Promise((resolve, reject) => {
      this.afAuth.auth.signInWithEmailAndPassword(email,password)
      .then(async userData => {
          const doc = await this.ensureUserInWorkspace(workspace, userData.user.uid)
          if(doc){
            resolve(userData);
          } else  {
            this.logout();
            reject("User does not belong to this workspace or the workspace does not exist.");
          }
      },
      err => reject(err)
      );
    }
    )
  }

  /**
   * Ensures a user is in the current workspace
   * @param workspace Workspace ID trying to sign into
   * @param uid: User ID trying to sign in
   * @returns A boolean if the user is in the given workspace
   */
  private ensureUserInWorkspace(workspace: string, uid: string){
    return this.afs.doc(`Workspaces/${workspace}/WorkspaceUsers/${uid}`).valueChanges().pipe(first()).toPromise()
  }

  /**
   * Logs out of Firebase
   */
  logout(){
    this.afAuth.auth.signOut();
  }

  getAuth(){
    return this.afAuth.authState;
  }
}
