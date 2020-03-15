import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { SettingsComponent } from './settings.component';

import {AuthService} from '../../services/auth.service';
import {MatDialog} from '@angular/material/dialog';

//Imports for material design modules
import {MatButtonModule} from '@angular/material/button';
import {MatIconModule} from '@angular/material/icon';
import {MatListModule} from '@angular/material/list';

import { BrowserAnimationsModule } from '@angular/platform-browser/animations';

//Mocks
import * as AuthTest from '../../services/auth.mock.service';

let auth: any = null;

describe('SettingsComponent', () => {
  let component: SettingsComponent;
  let fixture: ComponentFixture<SettingsComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ SettingsComponent ],
      providers: [{provide: AuthService, useClass: AuthTest.AuthMockService}, {provide: MatDialog}],
      imports: [MatButtonModule, MatListModule, MatIconModule, BrowserAnimationsModule]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(SettingsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();

    //default component to logged in
    auth = TestBed.get(AuthService);
    auth.login(
      AuthTest.EXPECTED_TEST_CREDENTIALS.email,
      AuthTest.EXPECTED_TEST_CREDENTIALS.password,
      AuthTest.EXPECTED_TEST_CREDENTIALS.workspace
    );
  });

  afterEach(() => {
    auth = null;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('Request Password Change', () => {
    it('should update to new pass if old and confirm are equal', async () => {
      let pass = AuthTest.EXPECTED_TEST_CREDENTIALS.password;
      let args = {oldPass: pass, newPass:'password', newPassConfirm:'password'};
      
      //set spy
      let jsalert = window.alert;
      window.alert = jest.fn();

      await component.sendPasswordChangeRequest(args);

      expect(window.alert).toHaveBeenCalledWith('Password successfully changed');

      //cleanup
      window.alert = jsalert;
    });

    it('should alert if old password is incorrect', async () => {
      let pass = 'incorrect';
      let args = {oldPass: pass, newPass:'password', newPassConfirm:'password'};
      
      //set spy
      let jsalert = window.alert;
      window.alert = jest.fn();

      await component.sendPasswordChangeRequest(args);

      expect(window.alert).toHaveBeenCalledWith('Password change failed:\n'+'err');

      //cleanup
      window.alert = jsalert;
    });

    it('should return silent if new password mismatch (since prevented by modal)', async () => {
      let pass = AuthTest.EXPECTED_TEST_CREDENTIALS.password;
      let args = {oldPass: pass, newPass:'password', newPassConfirm:'mismatch'};
      
      //set spy
      let jsalert = window.alert;
      window.alert = jest.fn();

      await component.sendPasswordChangeRequest(args);

      expect(window.alert).toHaveBeenCalledTimes(0);

      //cleanup
      window.alert = jsalert;
    });

  });

  it('should log out when logout is called', () => {
    component.logout();

    auth.getAuth().subscribe(
      val => expect(val).toBeNull()
    )
  });
});
