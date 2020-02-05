import { Component, OnInit } from '@angular/core';
import {AuthService} from '../../services/auth.service';
import {NavService} from '../../services/nav.service';
import {Router} from '@angular/router';
import {User} from '../../models/User';
import {WorkspaceInfo} from '../../models/WorkspaceInfo';

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

  constructor(
    private authService: AuthService,
    private navService: NavService,
    private router: Router
    ) { }

  ngOnInit() {
    this.authService.getUser().subscribe(
      val => this.user = val
    )

    this.authService.getWorkspace().subscribe(
      val => this.workspace = val
    )
  }

  /**
   * Requests a password change
   */
  requestPasswordChange(){
    
  }

  /**
   * Logs out and navigates to login screen
   */
  logout(){
    this.authService.logout();
  }

}
