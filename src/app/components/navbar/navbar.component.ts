import {Component, OnInit} from '@angular/core';
import {Router, NavigationEnd} from '@angular/router';
import {Location} from '@angular/common';

import {NavService} from '../../services/nav.service';
import {HierarchyItem} from 'src/app/models/HierarchyItem';
import {AuthService} from 'src/app/services/auth.service';

@Component({
  selector: 'app-navbar',
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.css']
})
export class NavbarComponent implements OnInit {

  /** The current location in the app */
  locationString = '/login';

  /**Reference to type of searching */
  searchType: string = '';

  /**Reference to parent */
  parent: HierarchyItem = {
    ID: '',
    name: '',
    parent: '',
    children: [],
    items: [],
    imageUrl: ''
  };

  /**The user's role */
  role: string = '';


  constructor(private routeLocation: Location, private router: Router, private navService: NavService, private authService: AuthService) {

    router.events.subscribe(val => {
      if (val instanceof NavigationEnd) {
        this.locationString = val.url;
        console.log(this.locationString);
      }
    });

    navService.getSearchType().subscribe(val => this.searchType = val.toLowerCase());
    navService.getParent().subscribe(val => this.parent = val);
  }

  ngOnInit() {
    this.authService.getRoleCurrent().subscribe(
      val => {
        console.log(val);
        this.role = val;
      }
    );
  }

  /**
   * Checks the current location
   * @returns a string representation of the current location in the app
   */
  checkLocation(): string {
    if (this.locationString.includes('/item/')) {
      return 'item';
    } else if (this.locationString === '/login') {
      return 'login';
    } else if (this.locationString === '/settings') {
      return 'settings';
    } else if (this.locationString === '/modify/categories') {
      return 'modifyCategories';
    } else if (this.locationString === '/modify/locations') {
      return 'modifyLocations';
    } else {
      return '/';
    }
  }

  /**
   * Goes back in the router
   */
  goBack() {
    this.routeLocation.back();
  }

  /**
   * Notifies the navservice that a hierarchy return was requested
   */
  returnInHierarchy() {
    this.routeLocation.back();
    this.navService.returnState();
  }

  /**
   * Returns home, forgets parent state
   */
  goHome() {
    this.navService.forgetParent();
    this.router.navigate(['search/' + (this.searchType ? this.searchType : 'categories') + '/root']);
  }

  /**
   * Sets the delete message from the nav service
   */
  delete(){
    this.navService.setDelete();
    this.navService.resetDelete();
  }

}
