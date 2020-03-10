import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { LoginComponent } from './login.component';

import {FormBuilder} from '@angular/forms';
import {AuthService} from '../../services/auth.service';
import {Router} from '@angular/router';
import {MatSnackBar} from '@angular/material/snack-bar';
import {MatDialog} from '@angular/material/dialog';
import {ReactiveFormsModule} from '@angular/forms';

import { NgModule } from '@angular/core';

//Imports for material design modules
import {MatButtonModule} from '@angular/material/button';
import {MatCardModule} from '@angular/material/card';
import {MatInputModule} from '@angular/material/input';
import {MatSnackBarModule} from '@angular/material/snack-bar';

//Mocks
import {AuthMockService} from '../../services/auth.mock.service';
import {RouterTestingModule} from '@angular/router/testing';

import { BrowserAnimationsModule } from '@angular/platform-browser/animations';

let navMock = jest.mock(
  '@angular/router',
  () => ({navigate: jest.fn()})
);


describe('LoginComponent', () => {
  let component: LoginComponent;
  let fixture: ComponentFixture<LoginComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ LoginComponent ],
      providers: [{provide: FormBuilder, useValue: new FormBuilder()}, {provide: AuthService, useClass: AuthMockService}, {provide: Router, useValue: navMock}, {provide: MatSnackBar}, {provide: MatDialog}],
      imports: [ReactiveFormsModule, MatButtonModule, MatCardModule, MatInputModule, MatSnackBarModule, RouterTestingModule.withRoutes([]), BrowserAnimationsModule]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(LoginComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('Login', () => {

  });

  describe('Form Errors', () => {
    it('should be invalid when empty', () => {
      expect(component.loginForm.valid).toBe(false);
    })

    it('should be valid with correct values', () => {

    })

    it('should be valid with correct values', () => {
      
    })

  })

  describe('Reset Email', () => {

  })

  describe('Redirect On Login', () => {

  })

});
