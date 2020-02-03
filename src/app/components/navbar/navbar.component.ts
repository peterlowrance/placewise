import { Component, OnInit } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import {Location} from '@angular/common'

import {NavService} from '../../services/nav.service'
import { ItemComponent } from '../item/item.component';

@Component({
  selector: 'app-navbar',
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.css']
})
export class NavbarComponent implements OnInit {
  locationString: string = "/login";
  state: string = "home";
  


  constructor(private routeLocation: Location, private router: Router, private navService: NavService) {
    navService.navState.subscribe( (state)=> this.state = state )
    router.events.subscribe(val => {
      if (val instanceof NavigationEnd){
        this.locationString = val.url;
        console.log(this.locationString);
      }
    })
  }

  ngOnInit() {
  }

  checkLocation(): string{
    if (this.locationString.includes('/item/')){
      return 'item';
    }
    else if (this.locationString == '/login'){
      return 'login';
    }
    else{
      return '/'
    }
  }

  goBack(){
    this.routeLocation.back();
  }

}
