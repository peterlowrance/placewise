import { Component, OnInit } from '@angular/core';
import {FormControl, FormGroup, FormBuilder, Validators} from '@angular/forms';
import {Router} from '@angular/router'
import {MatSnackBar} from '@angular/material/snack-bar'

import {AuthService} from '../../services/auth.service'

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent implements OnInit {
  emailControl = new FormControl('', [Validators.required, Validators.email]);
  passControl = new FormControl('',Validators.required);
  CIDControl = new FormControl('', Validators.required);
  loginForm: FormGroup;

  constructor(
    private formBuilder: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private snack: MatSnackBar
    ) { }

  ngOnInit() {
    this.loginForm = this.formBuilder.group({email: this.emailControl, password: this.passControl, CID: this.CIDControl})

    //If we are already logged in, redirect to homescreen
    this.authService.getAuth().subscribe(auth => {
      if(auth){
        //TODO: this is for testing purposes, replace below line with commented out code upon release to redirect login to main page
        //this.authService.logout()
        this.router.navigate(['/']);
      }
    })
  }

  getEmailErrors(){
    return this.emailControl.hasError('required') ? "Email is required" :
        this.emailControl.hasError('email') ? "Email entered is not valid" :
        "Email entered could not be read"
  }

  getPassErrors(){
    return this.passControl.hasError('required') ? "Password is required" :
        "Password is incorrect"
  }

  getCIDErrors(){
    return this.CIDControl.hasError('required') ? "Company ID is required" :
        "Company ID is incorrect"
  }

  onSubmit(){
    this.authService.login(
      this.loginForm.value.email,
      this.loginForm.value.password,
      this.loginForm.value.CID).then(res => {
        this.router.navigate(['/search/locations/root'])
      }).catch(err => {
        this.snack.open('Login Failed: '+err, "OK");
      });
  }

}
