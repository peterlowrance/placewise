import { Component, OnInit } from '@angular/core';
import {FormControl, FormGroup, FormBuilder, Validators} from '@angular/forms';
import {Router} from '@angular/router'

import {AuthService} from '../../services/auth.service'

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent implements OnInit {
  emailControl = new FormControl('', [Validators.required, Validators.email]);
  passControl = new FormControl('',Validators.required)
  CIDControl = new FormControl('', Validators.required)
  loginForm: FormGroup

  constructor(
    private formBuilder: FormBuilder,
    private authService: AuthService,
    private router: Router
    ) { }

  ngOnInit() {
    this.loginForm = this.formBuilder.group({email: this.emailControl, password: this.passControl, CID: this.CIDControl})

    //If we are already logged in, redirect to homescreen
    this.authService.getAuth().subscribe(auth => {
      if(auth){
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
    console.log(this.loginForm.value)
  }

}
