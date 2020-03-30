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

const TESTDATA: UserData[] = [
  {user: {firstName:"Anna",lastName:"Bray",email:"abray@gamil.com", workspace:"aP87kgghQ8mqvvwcZGQV"}, role:"User"}, 
  {user: {firstName:"Lord",lastName:"Saladin",email:"headbutt@yahoo.com", workspace: "aP87kgghQ8mqvvwcZGQV"}, role:"User"}, 
  {user: {firstName:"Cayde",lastName:"Six",email:"fastmouth@gamil.com", workspace: "aP87kgghQ8mqvvwcZGQV"}, role:"Admin"}
]

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
  toggleAdmin(change: MatCheckboxChange, user: UserData){
    //checked is Admin, unchecked is User
    let newRole = change.checked ? 'Admin' : 'User';
    //if we confirm, set the new user role
    if(confirm(`Are you sure you want to change ${user.user.firstName} ${user.user.lastName} to role ${newRole}?\nNew permissions will take effect on next token refresh.`)){
      this.adminService.setUserRole(user.user.email, newRole).then(
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
  deleteUser(user: UserData){
    if (confirm(`Are you sure you want to delete ${user.user.firstName} ${user.user.lastName}?\n` +
    'Their account will be deleted and all permissions revoked.')) {
      this.adminService.deleteUserByEmail(user.user.email).then(
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
    //if we have a user to add, add him/her
    if(val !== null && typeof val !== 'undefined'){
      this.adminService.addUserToWorkspace(val.email, val.firstName, val.lastName).then(
        () => alert(`${val.firstName} ${val.lastName} successfully added as a User`)
      ).catch(
        () => alert(`ADD FAILED\n${val.firstName} ${val.lastName} could not be added`)
      );
    }
  });
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
