import { Component, OnInit } from '@angular/core';
import { User } from '../../models/User';
import { AuthService } from '../../services/auth.service';
import { AdminService } from '../../services/admin.service';
import { MatCheckboxChange } from '@angular/material/checkbox';

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
export class ModerateUsersComponent implements OnInit {
  /** Array of workspace user data */
  workspaceUsers: UserData[];

  /** Table headers */
  headers: string[] = ['User', 'Admin','Delete'];

  /** Email of the singed-in user */
  signedInEmail: string;

  constructor(private authService: AuthService, private adminService: AdminService) { }

  ngOnInit() {
    this.adminService.getWorkspaceUsers().subscribe(
      (users) => {this.workspaceUsers = users; console.log(users);}
    )

    this.authService.getUser().subscribe(val => this.signedInEmail = val.email);
  }

  /**
   * Toggles the given user's admin/user status
   * @param change Matbox change value
   */
  toggleAdmin(change: MatCheckboxChange, user: UserData){
    console.log(change.checked);
  }

  /**
   * Deletes a given user from the application
   * @param user The user to be deleted
   */
  deleteUser(user: UserData){
    if (confirm(`Are you sure you want to delete ${user.user.firstName} ${user.user.lastName}?\n` +
    'Their account will be deleted and all permissions revoked.')) {
      this.adminService.deleteUserByEmail(user.user.email)//.then(
      //   () => alert(`${user.user.firstName} ${user.user.lastName} successfully deleted`)
      // ).catch(
      //   () => alert(`DELETION FAILED\n${user.user.firstName} ${user.user.lastName} could not be deleted`)
      // );
    }
  }

  /**
   * Adds a user to this workspace
   */
  addUsers(){
    //TODO: launch modal, add all email-like fields, prompt those that could not be added
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
