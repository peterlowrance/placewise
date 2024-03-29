import {Component, OnInit} from '@angular/core';
import {FormControl, FormGroup, FormBuilder, Validators} from '@angular/forms';
import {Router} from '@angular/router';
import {MatSnackBar} from '@angular/material/snack-bar';
import {MatDialog} from '@angular/material/dialog';
import {ResetPassDialogComponent} from '../reset-pass-dialog/reset-pass-dialog.component';

import {AuthService} from '../../services/auth.service';
import { firestore } from 'firebase';
import * as firebase from 'firebase';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent implements OnInit {
  emailControl = new FormControl('', [Validators.required, Validators.email]);
  passControl = new FormControl('', Validators.required);
  loginForm: FormGroup;

  constructor(
    private formBuilder: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private snack: MatSnackBar,
    private diag: MatDialog
  ) {
  }

  ngOnInit() {
    this.loginForm = this.formBuilder.group({
      email: this.emailControl,
      password: this.passControl
    });

    //If we are already logged in, redirect to homescreen
    this.authService.getAuth().subscribe(auth => this.redirect(auth));
  }

  /**
   * Redirects to the home page if auth is valid
   * @param auth Auth state
   */
  redirect(auth: firebase.User){
    if (auth) {
      this.router.navigate(['/w/Apex Fab/search/categories/root']); // SCREAM
    }
  }

  getEmailErrors() {
    return this.emailControl.hasError('required') ? "Email is required" :
      this.emailControl.hasError('email') ? "Email entered is not valid" :
        "Email entered could not be read"
  }

  getPassErrors() {
    return this.passControl.hasError('required') ? "Password is required" :
      "Password is incorrect"
  }

  onSubmit() {
    return this.authService.login(
      this.loginForm.value.email,
      this.loginForm.value.password).then(res => {
      //this.router.navigate(['/search/locations/root']);
    }).catch(err => {
      this.snack.open('Login Failed: ' + err, "OK", {duration: 3000});
    });
  }

  /**
   * Logic for forgetting a password, launches modal
   */
  forgotPassword() {
    this.diag.open(ResetPassDialogComponent, {
        width: '20rem'
      }
    ).afterClosed().subscribe(val => this.sendPasswordEmail(val));
  }

  /**
   * Sends the reset email to the given email address
   * @param emailInfo Email address to send password reset to
   */
  sendPasswordEmail(emailInfo: string){
    if(emailInfo){
      return this.authService.sendPasswordResetEmail(emailInfo).then(
        () => this.snack.open("Password reset email has been sent", "OK", {duration: 3000}),
        (fail) => this.snack.open(fail, "OK", {duration: 3000})
      )
    }
  }

  /**
   * Opens link to a new workspace
   */
  newWorkspace() {
    window.open("https://google.com", "_blank");
  }

}
