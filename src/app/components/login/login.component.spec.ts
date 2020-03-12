import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { LoginComponent } from './login.component';

import {FormBuilder} from '@angular/forms';
import {AuthService} from '../../services/auth.service';
import {Router} from '@angular/router';
import {MatSnackBar} from '@angular/material/snack-bar';
import {MatDialog} from '@angular/material/dialog';
import {ReactiveFormsModule} from '@angular/forms';

//Imports for material design modules
import {MatButtonModule} from '@angular/material/button';
import {MatCardModule} from '@angular/material/card';
import {MatInputModule} from '@angular/material/input';
import {MatSnackBarModule} from '@angular/material/snack-bar';

//Mocks
import * as AuthTest from '../../services/auth.mock.service';
import {RouterTestingModule} from '@angular/router/testing';

import { BrowserAnimationsModule } from '@angular/platform-browser/animations';

let navMock = {
  navigate: jest.fn((url: string[]) => {})
}

let snackMock = {
  open: jest.fn((message: string, button: string, options: {duration: number}) => {})
}

const mockRoute = new RouterTestingModule();

let snackImp;

let navImp;


describe('LoginComponent', () => {
  let component: LoginComponent;
  let fixture: ComponentFixture<LoginComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ LoginComponent ],
      providers: [{provide: FormBuilder, useValue: new FormBuilder()}, {provide: Router, useValue: navMock}, {provide: AuthService, useClass: AuthTest.AuthMockService}, {provide: MatSnackBar, useValue: snackMock}, {provide: MatDialog}],
      imports: [ReactiveFormsModule, MatButtonModule, MatCardModule, MatInputModule, MatSnackBarModule, RouterTestingModule.withRoutes([]), BrowserAnimationsModule]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(LoginComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();

    snackImp = TestBed.get(MatSnackBar);
    navImp = TestBed.get(Router);
  });

  afterEach(() => {
    snackImp.open.mockClear();
    navImp.navigate.mockClear();
  })

  it('should create', () => {
    expect(component).toBeTruthy();
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
    it('should display email required error', () => {
      let email = component.loginForm.controls.email;

      //email not a real email
      email.setValue('');

      expect(component.getEmailErrors()).toBe('Email is required');
    });

    it('should display email malformatted error', () => {
      let email = component.loginForm.controls.email;

      //email not a real email
      email.setValue('WRONG@');

      expect(component.getEmailErrors()).toBe('Email entered is not valid');
    });

    it('should display password required error', () => {
      let pass = component.loginForm.controls.password;

      //email not a real email
      pass.setValue('');

      expect(component.getPassErrors()).toBe('Password is required');
    });

    it('should display workspace required error', () => {
      let work = component.loginForm.controls.CID;

      //email not a real email
      work.setValue('');

      expect(component.getCIDErrors()).toBe('Company ID is required');
    });
  });

  describe('Reset Email', () => {
    it('sends when email is in fake DB', async () => {
      await component.sendPasswordEmail(AuthTest.MOCK_USER.email);
      await expect(snackImp.open).toHaveBeenCalledWith("Password reset email has been sent", "OK", { duration: 3000 });
    })

    it('does not send when email is not in fake DB', async () => {
      await component.sendPasswordEmail('fake');
      return await expect(snackImp.open).toHaveBeenCalledWith('failure', "OK", {duration: 3000})
    })
  })

  describe('Login', () => {

    it('should not log in with incorrect password', async () => {
      let email = component.loginForm.controls.email;
      let pass = component.loginForm.controls.password;
      let work = component.loginForm.controls.CID;

      email.setValue(AuthTest.EXPECTED_TEST_CREDENTIALS.email);
      pass.setValue('incorrect');
      work.setValue(AuthTest.EXPECTED_TEST_CREDENTIALS.workspace);

      await component.onSubmit();

      return await expect(snackImp.open).toHaveBeenCalledWith('Login Failed: ' + 'LOG-IN ERROR', "OK", {duration: 3000});
    });

    it('should not log in with incorrect email', async () => {
      let email = component.loginForm.controls.email;
      let pass = component.loginForm.controls.password;
      let work = component.loginForm.controls.CID;

      email.setValue('incorrect');
      pass.setValue(AuthTest.EXPECTED_TEST_CREDENTIALS.password);
      work.setValue(AuthTest.EXPECTED_TEST_CREDENTIALS.workspace);

      await component.onSubmit();

      return await expect(snackImp.open).toHaveBeenCalledWith('Login Failed: ' + 'LOG-IN ERROR', "OK", {duration: 3000});
    });

    it('does not redirect when not signed in', () => {
      component.redirect(null);
      expect(navImp.navigate.mock.calls.length).toBe(0);
    });
  });

  describe('Navigate Tests', () => {
    it('should log in with correct credentials', async () => {
      let email = component.loginForm.controls.email;
      let pass = component.loginForm.controls.password;
      let work = component.loginForm.controls.CID;

      email.setValue(AuthTest.EXPECTED_TEST_CREDENTIALS.email);
      pass.setValue(AuthTest.EXPECTED_TEST_CREDENTIALS.password);
      work.setValue(AuthTest.EXPECTED_TEST_CREDENTIALS.workspace);

      await component.onSubmit();

      return await expect(navImp.navigate).toHaveBeenCalledWith(['/search/locations/root']);
    });

    it('redirects when signed in', () => {
      component.redirect({});
      expect(navImp.navigate).toHaveBeenCalledWith(['/search/categories/root']);
    });

  });

});
