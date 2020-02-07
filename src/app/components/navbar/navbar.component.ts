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
  /** The current location in the app */
  locationString: string = "/login";
  /** The current search state */
  state: string = "Home";
  


  constructor(private routeLocation: Location, private router: Router, private navService: NavService) {
    navService.navState.subscribe( (state)=>
      this.state = (state !== null && state === 'root') ? 'Placewise' : state
    );

    router.events.subscribe(val => {
      if (val instanceof NavigationEnd){
        this.locationString = val.url;
        console.log(this.locationString);
      }
    })
  }

  ngOnInit() {
  }

  /**
   * Checks the current location
   * @returns a string representation of the current location in the app
   */
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

  /**
   * Goes back in the router
   */
  goBack(){
    this.routeLocation.back();
  }

  /**
   * Notifies the navservice that a hierarchy return was requested
   */
  returnInHierarchy(){

  }

}
