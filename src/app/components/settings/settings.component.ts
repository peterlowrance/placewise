import { Component, OnInit } from '@angular/core';
import {AuthService} from '../../services/auth.service';
import {NavService} from '../../services/nav.service';
import {Router} from '@angular/router';
import {User} from '../../models/User';
import {WorkspaceInfo} from '../../models/WorkspaceInfo';
import {MatDialog} from '@angular/material/dialog';
import {ChangePassDialogComponent} from '../change-pass-dialog/change-pass-dialog.component';
import { AdminService } from 'src/app/services/admin.service';
import { SearchService } from 'src/app/services/search.service';

@Component({
  selector: 'app-settings',
  templateUrl: './settings.component.html',
  styleUrls: ['./settings.component.css']
})
export class SettingsComponent implements OnInit {
  user: User = {
    firstName: '',
    lastName: '',
    email: '',
    workspace: '',
    id: ''
  };
  workspace: WorkspaceInfo = {
    name: '',
    id: '',
    defaultUsersForReports: []
  };
  role: string; //the user's role, user or admin
  recieveEmails: boolean;

  constructor(
    private authService: AuthService,
    private searchService: SearchService,
    private diag: MatDialog,
    private router: Router,
    private adminService: AdminService
    ) { }

  ngOnInit() {
    this.authService.getUser().subscribe(
      val => {
        this.user = val;
      }
    );

    this.searchService.getWorkspaceInfo('Apex Fab').subscribe(workspaceInfo => {
      this.workspace = workspaceInfo;
    })

    this.authService.getRole().subscribe(
      val => {
        this.role = val;
      }
    );

    this.authService.getRecieveEmails().subscribe(
      val => {
        this.recieveEmails = val;
      }
    )
  }

  /**
   * Requests a password change
   */
  requestPasswordChange(){
    let data = { oldPass: '', newPass: '', newPassConfirm: '' };

    this.diag.open(ChangePassDialogComponent,
      {
        width: '30rem',
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
    if(val !== null && typeof val !== 'undefined' && val.newPass === val.newPassConfirm
    && val.oldPass !== '' && val.newPass !== '' && val.newPassConfirm !== ''){
      return this.authService.changePassword(val.oldPass, val.newPass).then(
        () => alert('Password successfully changed'),
        (error) => alert('Password change failed:\n'+error)
      );
    }
  }

  /**
   * Logs out and navigates to login screen
   */
  logout() {
    this.authService.logout();
  }

  hack(){
    //this.adminService.hack();
  }

  setEmailReports(event){
    this.adminService.setEmailReportsForUser(this.workspace.id, this.user.id, event.checked);
  }
}
