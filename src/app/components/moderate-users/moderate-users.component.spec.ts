import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ModerateUsersComponent } from './moderate-users.component';
import { AuthService } from 'src/app/services/auth.service';
//Imports for material design modules
import {MatButtonModule} from '@angular/material/button';
import {MatIconModule} from '@angular/material/icon'
import {MatTableModule} from '@angular/material/table';
import {MatCheckboxModule, MatCheckboxChange, MatCheckbox} from '@angular/material/checkbox';

//Mocks
import * as AuthTest from '../../services/auth.mock.service';
import {RouterTestingModule} from '@angular/router/testing';

import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { of } from 'rxjs';
import { AdminMockService } from 'src/app/services/admin.mock.service';
import { AdminService } from 'src/app/services/admin.service';
import {MatDialogModule, MatDialog, MatDialogRef} from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material';

let auth;

let snackImp;

describe('ModerateUsersComponent', () => {
  let component: ModerateUsersComponent;
  let fixture: ComponentFixture<ModerateUsersComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ModerateUsersComponent ],
      providers: [ {provide: AuthService, useClass: AuthTest.AuthMockService}, {provide: AdminService, useClass: AdminMockService}, {provide: MatDialog}, {provide: MatSnackBar} ],
      imports: [MatButtonModule, MatIconModule, MatTableModule, MatCheckboxModule, MatDialogModule]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ModerateUsersComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
    //default component to logged in
    auth = TestBed.get(AuthService);
    auth.login(
      AuthTest.EXPECTED_TEST_CREDENTIALS.email,
      AuthTest.EXPECTED_TEST_CREDENTIALS.password,
      AuthTest.EXPECTED_TEST_CREDENTIALS.workspace
    );
    snackImp = TestBed.get(MatSnackBar);
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should get the expected email on equivalency', () =>{
    let user = {user:AuthTest.MOCK_USER, role:AuthTest.MOCK_ROLE}
    expect(component.isCurrentUser(user)).toBeTruthy();
  });

  it('should get the wrong email on inequivalency', () =>{
    let incorrectUser = {firstName: 'USER',
    lastName: 'McUSER',
    email: 'incorrect@correct.com',
    workspace: 'aaaaaaa'};
    let user = {user:incorrectUser, role:AuthTest.MOCK_ROLE}
    expect(component.isCurrentUser(user)).toBeFalsy();
  });

  it('should add user to DB if valid credentials', async () => {
    let mockAlert = spyOn(snackImp, 'open').and.callFake(() => {});

    //default passing email for testing jig
    let user = {firstName:"Anna",lastName:"Bray",email:"abray@gamil.com"};

    await component.addUserToDB(user);
    expect(mockAlert).toHaveBeenCalledWith(`${user.firstName} successfully added as a User`, "OK", {duration: 3000, panelClass: ['mat-toolbar']});
  });

  it('should error correctly', async () => {
    let mockAlert = spyOn(snackImp, 'open').and.callFake(() => {});
    //send different email, will fail the testing jig
    let user = {firstName:"Anna",lastName:"Bray",email:"MALFORMATTED"};

    await component.addUserToDB(user);
    expect(mockAlert).toHaveBeenCalledWith(`ADD FAILED\n${user.firstName} could not be added`, "OK", {duration: 3000, panelClass: ['mat-warn']});
  });

  it('should do nothing if modal returns nothing', async () => {
    let mockAlert = spyOn(snackImp, 'open').and.callFake(() => {});
    //send different email, will fail the testing jig
    let user = null

    await component.addUserToDB(user);
    expect(mockAlert).toHaveBeenCalledTimes(0);
  });

  it('should do nothing if modal returns nothing', async () => {
    let mockAlert = spyOn(snackImp, 'open').and.callFake(() => {});
    //send different email, will fail the testing jig
    let user = undefined

    await component.addUserToDB(user);
    expect(mockAlert).toHaveBeenCalledTimes(0);
  });

  it('should delete an existing user', async () => {
    let mockAlert2 = spyOn(snackImp, 'open').and.callFake(() => {});
    let mockConfirm = jest.fn(() => true);
    let confirm = window.confirm;
    window.confirm = mockConfirm;

    //default passing email for testing jig
    let userr = {user:{firstName:"Anna",lastName:"Bray",email:"abray@gamil.com", workspace:'aaaaaaa'}, role:'User'};

    await component.deleteUser(userr);
    expect(mockAlert2).toHaveBeenCalledWith(`${userr.user.firstName} successfully deleted`, "OK", {duration: 3000, panelClass: ['mat-toolbar']});
    window.confirm = confirm;
  });

  it('should fail on malformatted', async () => {
    let mockAlert = spyOn(snackImp, 'open').and.callFake(() => {});
    let mockConfirm = jest.fn(() => true);
    let confirm = window.confirm;
    window.confirm = mockConfirm;

    //miss default passing email for testing jig
    let user = {user:{firstName:"Anna",lastName:"Bray",email:"MALFORMATTED", workspace:'aaaaaaa'}, role:'User'};

    await component.deleteUser(user)
    expect(mockAlert).toHaveBeenCalledWith(`DELETION FAILED\n${user.user.firstName} could not be deleted`, "OK", {duration: 3000, panelClass: ['mat-warn']});

    window.confirm = confirm;
  });

  it('should fail on cancel from modal', async () => {
    let mockAlert = spyOn(snackImp, 'open').and.callFake(() => {});
    let mockConfirm = jest.fn(() => false);
    let confirm = window.confirm;
    window.confirm = mockConfirm;

    //default passing email for testing jig
    let user = {user:{firstName:"Anna",lastName:"Bray",email:"abray@gamil.com", workspace:'aaaaaaa'}, role:'User'};

    await component.deleteUser(user);
    expect(mockAlert).toHaveBeenCalledTimes(0);

    window.confirm = confirm;
  });

  it('should toggle admin', async () => {
    let mockAlert = spyOn(snackImp, 'open').and.callFake(() => {});
    let mockConfirm = jest.fn(() => true);
    let confirm = window.confirm;
    window.confirm = mockConfirm;

    //default passing email for testing jig
    let user = {user:{firstName:"Anna",lastName:"Bray",email:"abray@gamil.com", workspace:'aaaaaaa'}, role:'User'};
    let change = new MatCheckboxChange();
    change.checked = true;

    await component.toggleAdmin(change, user);
    expect(mockAlert).toHaveBeenCalledWith(`${user.user.firstName} is now a/an Admin`, "OK", {duration: 3000, panelClass: ['mat-toolbar']});

    window.confirm = confirm;
  });

  it('should fail to toggle admin with incorrect creds', async () => {
    let mockAlert = spyOn(snackImp, 'open').and.callFake(() => {});
    let mockConfirm = jest.fn(() => true);
    let confirm = window.confirm;
    window.confirm = mockConfirm;

    //ignore default passing email for testing jig
    let userr = {user:{firstName:"Anna",lastName:"Bray",email:"MALFORMATTED", workspace:'aaaaaaa'}, role:'User'};
    let change = new MatCheckboxChange();
    change.checked = true;

    await component.toggleAdmin(change, userr);
    expect(mockAlert).toHaveBeenCalledWith(`TOGGLE FAILED:\nERROR`, "OK", {duration: 3000, panelClass: ['mat-warn']});

    window.confirm = confirm;
  });
});
