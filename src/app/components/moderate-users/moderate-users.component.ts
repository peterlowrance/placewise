import { Component, OnInit, OnDestroy } from '@angular/core';
import { AuthService } from '../../services/auth.service';
import { AdminService } from '../../services/admin.service';
import { MatCheckboxChange } from '@angular/material/checkbox';
import {MatDialog} from '@angular/material/dialog';
import {AddUserDialogComponent} from '../add-user-dialog/add-user-dialog.component';
import { Subscription } from 'rxjs';
import { MatSnackBar } from '@angular/material';
import { WorkspaceUser } from 'src/app/models/WorkspaceUser';


@Component({
  selector: 'app-moderate-users',
  templateUrl: './moderate-users.component.html',
  styleUrls: ['./moderate-users.component.css']
})
export class ModerateUsersComponent implements OnInit, OnDestroy {
  /** Array of workspace user data */
  workspaceUsers: WorkspaceUser[];

  /** Table headers */
  headers: string[] = ['User', 'Admin','Delete'];

  /** Email of the singed-in user */
  signedInEmail: string;

  /** User subscription */
  userSub: Subscription;

  admins: WorkspaceUser[]; // For picking who reports go to by default
  defaults: WorkspaceUser[]; // For picking who reports go to by default

  constructor(private authService: AuthService, private adminService: AdminService, private diag: MatDialog, private snack: MatSnackBar) { }

  ngOnInit() {
    this.adminService.getWorkspaceUsers().subscribe( (users) => this.workspaceUsers = users.sort(function(a, b) {
      var nameA = a.firstName.toUpperCase(); // ignore upper and lowercase
      var nameB = b.firstName.toUpperCase(); // ignore upper and lowercase
      if (nameA < nameB) {
        return -1;
      }
      if (nameA > nameB) {
        return 1;
      }
      
      if(nameA === nameB) {
        nameA = a.lastName.toUpperCase(); // ignore upper and lowercase
        nameB = b.lastName.toUpperCase(); // ignore upper and lowercase

        if (nameA < nameB) {
          return -1;
        }
        if (nameA > nameB) {
          return 1;
        }
      }
      // names must be equal
      return 0;
    }));
    this.userSub = this.authService.getUser().subscribe(val => this.signedInEmail = val.email);

    this.adminService.getWorkspaceUsers().subscribe(users => {
      if(users && users.length === this.authService.usersInWorkspace){
        // Load admins for selection
        this.admins = users.filter(element => { return element.role === "Admin" });
        // Load selected people to report to
        this.defaults = this.admins.filter(element => { return this.authService.workspace.defaultUsersForReports.indexOf(element.id) > -1 });
      }
    });
  }

  ngOnDestroy(){
    this.userSub.unsubscribe();
  }

  /**
   * Toggles the given user's admin/user status
   * @param change Matbox change value
   */
  async toggleAdmin(change: MatCheckboxChange, user: WorkspaceUser){
    //checked is Admin, unchecked is User
    let newRole = change.checked ? 'Admin' : 'User';
    //if we confirm, set the new user role
    if(confirm(`Are you sure you want to change ${user.firstName} ${user.lastName} to role ${newRole}?\nNew permissions will take effect on next token refresh.`)){
      return this.adminService.setUserRole(user.email, newRole).then(
        () => this.snack.open(`${user.firstName} is now a/an ${newRole}`, "OK", {duration: 3000, panelClass: ['mat-toolbar']}),
        (err) => this.snack.open(`TOGGLE FAILED:\n${err}`, "OK", {duration: 3000, panelClass: ['mat-warn']})
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
  async deleteUser(user: WorkspaceUser){
    if (confirm(`Are you sure you want to delete ${user.firstName} ${user.lastName}?\n` +
    'Their account will be deleted and all permissions revoked.')) {
      return this.adminService.deleteUserByEmail(user.email).then(
        () => this.snack.open(`${user.firstName} successfully deleted`, "OK", {duration: 3000, panelClass: ['mat-toolbar']}),
      ).catch(
        () => this.snack.open(`DELETION FAILED\n${user.firstName} could not be deleted`, "OK", {duration: 3000, panelClass: ['mat-warn']})
      );
    }
  }

  /**
   * Adds a user to this workspace
   */
  addUsers(){
    //open add user dialog
    this.diag.open(AddUserDialogComponent, {
      width: '88%',
      maxWidth: '32rem'
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
    if(user !== null && typeof user !== 'undefined' && user.firstName != "" && user.lastName != "" && user.email != ""){
      return this.adminService.addUserToWorkspace(user.email, user.firstName, user.lastName).then(
        () => this.authService.sendPasswordResetEmail(user.email).then(
          () => this.snack.open(`${user.firstName} successfully added as a User`, "OK", {duration: 3000, panelClass: ['mat-toolbar']}),
          (fail) => {
            this.snack.open(fail, "OK", {duration: 3000});
            console.log(fail);
          }
        )
      ).catch(
        () => this.snack.open(`ADD FAILED\n${user.firstName} could not be added`, "OK", {duration: 3000, panelClass: ['mat-warn']})
      );
    }
  }

  /**
   * Returns true if the user in the given row is this user
   * @param user The user for this row
   * @returns true if the user in the row is this signed-in user, else false
   */
  isCurrentUser(user: WorkspaceUser): boolean{
    return this.signedInEmail === user.email;
  }

  updateDefaultReportedUsers(event) {
    this.adminService.updateDefaultReportUsers(event.map(user => user.id));
  }
}
