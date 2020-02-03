import { Component, OnInit } from '@angular/core';
import {AuthService} from '../../services/auth.service'
import {NavService} from '../../services/nav.service'

@Component({
  selector: 'app-settings',
  templateUrl: './settings.component.html',
  styleUrls: ['./settings.component.css']
})
export class SettingsComponent implements OnInit {

  constructor(
    private authService: AuthService,
    private navService: NavService
    ) { }

  ngOnInit() {
  }

  requestPasswordChange(){
    
  }

  logout(){
    this.authService.logout();
  }

}
