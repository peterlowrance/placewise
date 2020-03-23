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
  {user: {firstName:"Anna",lastName:"Bray",email:"abray@gamil.com"}, role:"User"}, 
  {user: {firstName:"Lord",lastName:"Saladin",email:"headbutt@yahoo.com"}, role:"User"}, 
  {user: {firstName:"Cayde",lastName:"Six",email:"fastmouth@gamil.com"}, role:"Admin"}
]

@Component({
  selector: 'app-moderate-users',
  templateUrl: './moderate-users.component.html',
  styleUrls: ['./moderate-users.component.css']
})
export class ModerateUsersComponent implements OnInit {
  /** Array of workspace user data */
  workspaceUsers: UserData[] = TESTDATA;

  headers: string[] = ['User', 'Admin','Delete'];

  constructor(private authService: AuthService, private adminService: AdminService) { }

  ngOnInit() {

  }

  toggleAdmin(change: MatCheckboxChange){
    console.log(change.checked);
  }

  deleteUser(user: UserData){
    if (confirm('Are you sure you want to delete this user?\n' +
    'Their account will be deleted and all permissions revoked.')) {
      //TODO: delete(user).then(() => {
        alert(`${user.user.firstName} ${user.user.lastName}, at ${user.user.email}, a/an ${user.role}`);
      //});
    }
  }

  addUsers(){
    //TODO: launch modal, add all email-like fields, prompt those that could not be added
  }

}
