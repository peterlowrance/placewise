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
import * as AuthTest from '../../services/auth.mock.service';
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
      providers: [{provide: FormBuilder, useValue: new FormBuilder()}, {provide: AuthService, useClass: AuthTest.AuthMockService}, {provide: Router, useValue: navMock}, {provide: MatSnackBar}, {provide: MatDialog}],
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
    it('should log in with correct credentials', () => {
      //TODO
    });

    it('should not log in with incorrect password', () => {
      //TODO
    });

    it('should not log in with incorrect email', () => {
      //TODO
    });

  });

  describe('Form Errors', () => {
    it('should be invalid when empty', () => {
      expect(component.loginForm.valid).toBe(false);
    })

    it('should be valid with correct values', () => {
      //Don't use the control name, use the key in formBuilder.group
      let email = component.loginForm.controls.email;
      let pass = component.loginForm.controls.password;
      let work = component.loginForm.controls.CID;

      email.setValue(AuthTest.EXPECTED_TEST_CREDENTIALS.email);
      pass.setValue(AuthTest.EXPECTED_TEST_CREDENTIALS.password);
      work.setValue(AuthTest.EXPECTED_TEST_CREDENTIALS.workspace);

      expect(component.loginForm.valid).toBe(true);
    })

    it('should be invalid with one empty value', () => {
      let email = component.loginForm.controls.email;
      let pass = component.loginForm.controls.password;
      let work = component.loginForm.controls.CID;

      //email empty
      //email.setValue(AuthTest.EXPECTED_TEST_CREDENTIALS.email);
      pass.setValue(AuthTest.EXPECTED_TEST_CREDENTIALS.password);
      work.setValue(AuthTest.EXPECTED_TEST_CREDENTIALS.workspace);

      expect(component.loginForm.valid).toBe(false);

      //pass empty
      email.setValue(AuthTest.EXPECTED_TEST_CREDENTIALS.email);
      pass.setValue('');

      expect(component.loginForm.valid).toBe(false);

      //workspace empty
      pass.setValue(AuthTest.EXPECTED_TEST_CREDENTIALS.password);
      work.setValue('');

      expect(component.loginForm.valid).toBe(false);
    })

    it('should be invalid with malformatted email and pass', () => {
      let email = component.loginForm.controls.email;
      let pass = component.loginForm.controls.password;
      let work = component.loginForm.controls.CID;

      //email not a real email
      email.setValue('WRONG@');
      pass.setValue(AuthTest.EXPECTED_TEST_CREDENTIALS.password);
      work.setValue(AuthTest.EXPECTED_TEST_CREDENTIALS.workspace);

      expect(component.loginForm.valid).toBe(false);
    })

  });

  describe('Form Error String Returns', () => {
    //TODO
  });

  describe('Reset Email', () => {
    it('sends when email is in fake DB', () => {
      const email = AuthTest.EXPECTED_TEST_CREDENTIALS.email;

      //expect(component.sendPasswordEmail(email))

    })

    it('does not send when email is not in fake DB', () => {
      
    })
  })

  describe('Redirect On Login', () => {

  })

});
