import { Component, OnInit, OnDestroy } from '@angular/core';
import { User } from '../../models/User';
import { AuthService } from '../../services/auth.service';
import { AdminService } from '../../services/admin.service';
import { MatCheckboxChange } from '@angular/material/checkbox';
import {MatDialog} from '@angular/material/dialog';
import {AddUserDialogComponent} from '../add-user-dialog/add-user-dialog.component';
import { Subscription } from 'rxjs';

interface UserData{
  user: User;
  role: string;
}

@Component({
  selector: 'app-moderate-users',
  templateUrl: './moderate-users.component.html',
  styleUrls: ['./moderate-users.component.css']
})
export class ModerateUsersComponent implements OnInit, OnDestroy {
  /** Array of workspace user data */
  workspaceUsers: UserData[];

  /** Table headers */
  headers: string[] = ['User', 'Admin','Delete'];

  /** Email of the singed-in user */
  signedInEmail: string;

  /** User subscription */
  userSub: Subscription;

  constructor(private authService: AuthService, private adminService: AdminService, private diag: MatDialog) { }

  ngOnInit() {
    this.adminService.getWorkspaceUsers().subscribe( (users) => this.workspaceUsers = users );
    this.userSub = this.authService.getUser().subscribe(val => this.signedInEmail = val.email);
  }

  ngOnDestroy(){
    this.userSub.unsubscribe();
  }

  /**
   * Toggles the given user's admin/user status
   * @param change Matbox change value
   */
  async toggleAdmin(change: MatCheckboxChange, user: UserData){
    //checked is Admin, unchecked is User
    let newRole = change.checked ? 'Admin' : 'User';
    //if we confirm, set the new user role
    if(confirm(`Are you sure you want to change ${user.user.firstName} ${user.user.lastName} to role ${newRole}?\nNew permissions will take effect on next token refresh.`)){
      return this.adminService.setUserRole(user.user.email, newRole).then(
        () => alert(`${user.user.firstName} ${user.user.lastName} is now a/an ${newRole}`),
        (err) => alert(`TOGGLE FAILED:\n${err}`)
      );
    }
    else{ //else reset the checkbox state
      change.source.checked = !change.checked;
    }
  }

  /**
   * Deletes a given user from the application
   * @param user The user to be deleted
   */
  async deleteUser(user: UserData){
    if (confirm(`Are you sure you want to delete ${user.user.firstName} ${user.user.lastName}?\n` +
    'Their account will be deleted and all permissions revoked.')) {
      return this.adminService.deleteUserByEmail(user.user.email).then(
        () => alert(`${user.user.firstName} ${user.user.lastName} successfully deleted`)
      ).catch(
        () => alert(`DELETION FAILED\n${user.user.firstName} ${user.user.lastName} could not be deleted`)
      );
    }
  }

  /**
   * Adds a user to this workspace
   */
  addUsers(){
    //open add user dialog
    this.diag.open(AddUserDialogComponent, {
      width: '80%'
    }
  ).afterClosed().subscribe(val =>{
    this.addUserToDB(val);
  });
  }

  /**
   * Adds a user to the backend DB
   * @param user The user info returned by the modal
   */
  async addUserToDB(user: {firstName:string, lastName:string, email:string}){
    //if we have a user to add, add him/her
    if(user !== null && typeof user !== 'undefined'){
      return this.adminService.addUserToWorkspace(user.email, user.firstName, user.lastName).then(
        () => alert(`${user.firstName} ${user.lastName} successfully added as a User`)
      ).catch(
        () => alert(`ADD FAILED\n${user.firstName} ${user.lastName} could not be added`)
      );
    }
  }

  /**
   * Returns true if the user in the given row is this user
   * @param user The user for this row
   * @returns true if the user in the row is this signed-in user, else false
   */
  isCurrentUser(user: UserData): boolean{
    return this.signedInEmail === user.user.email;
  }
}
