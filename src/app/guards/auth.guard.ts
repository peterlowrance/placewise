//Adapted from knowledge gained from : https://www.udemy.com/share/1020jgCEoadlpRTHw=/

import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { AngularFireAuth } from '@angular/fire/auth';
import { Observable } from 'rxjs';
import {map} from 'rxjs/operators';

/**
 * Wraps router activation to allow routing between user pages when signed in to the
 * Placewise Firebase database. 
 */
@Injectable()
export class AuthGuard implements CanActivate {
    constructor (
        private router: Router,
        private afAuth: AngularFireAuth
    ) {}

    /**
     * canActivate communicates with the Placewise Firestore database and
     * determines if a user can access user pages.
     * 
     * @returns {Observable<boolean>} An observable boolean equivalent to 'can this user access this page'
     * @err navigates to login screen whenever accessing restricted routes
     */
    canActivate(): Observable<boolean> {
        return this.afAuth.authState.pipe(map(auth => {
            if(!auth){
                this.router.navigate(['/login']);
                return false;
            }
            else{
                return true;
            }
        }))
    }
}