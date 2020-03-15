import { Component, OnInit } from '@angular/core';
import {AuthService} from '../../services/auth.service';
import {NavService} from '../../services/nav.service';
import {Router} from '@angular/router';
import {User} from '../../models/User';
import {WorkspaceInfo} from '../../models/WorkspaceInfo';
import {MatDialog} from '@angular/material/dialog';
import {ChangePassDialogComponent} from '../change-pass-dialog/change-pass-dialog.component';

@Component({
  selector: 'app-settings',
  templateUrl: './settings.component.html',
  styleUrls: ['./settings.component.css']
})
export class SettingsComponent implements OnInit {
  user: User = {
    firstName: '',
    lastName: '',
    email: ''
  };
  workspace: WorkspaceInfo = {
    name: '',
    id: ''
  };
  role: string; //the user's role, user or admin

  constructor(
    private authService: AuthService,
    private diag: MatDialog
    ) { }

  ngOnInit() {
    this.authService.getUser().subscribe(
      val => this.user = val
    );

    this.authService.getWorkspace().subscribe(
      val => this.workspace = val
    );

    this.authService.getRole().subscribe(
      val => this.role = val
    );
  }

  /**
   * Requests a password change
   */
  requestPasswordChange(){
    let data = { oldPass: '', newPass: '', newPassConfirm: '' };

    this.diag.open(ChangePassDialogComponent, 
      {
        width: '60%',
        data: data
      }
    ).afterClosed().subscribe(val => this.sendPasswordChangeRequest(val));
  }

  /**
   * Validates password equality and sends request to change password
   * @param val password change object sent by modal
   */
  sendPasswordChangeRequest(val: {oldPass:string, newPass:string, newPassConfirm:string}){
    //if returned a confirm
    if(val && val.newPass === val.newPassConfirm){
      return this.authService.changePassword(val.oldPass, val.newPass).then(
        () => alert('Password successfully changed'),
        (error) => alert('Password change failed:\n'+error)
      );
    }
  }

  /**
   * Logs out and navigates to login screen
   */
  logout(){
    this.authService.logout();
  }

}
