import {Component, OnInit} from '@angular/core';
import {Router, NavigationEnd} from '@angular/router';
import {Location} from '@angular/common';

import {NavService} from '../../services/nav.service';
import {ItemComponent} from '../item/item.component';
import { of } from 'rxjs';
import { HierarchyItem } from 'src/app/models/HierarchyItem';

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


  constructor(private routeLocation: Location, private router: Router, private navService: NavService) {

    router.events.subscribe(val => {
      if (val instanceof NavigationEnd) {
        this.locationString = val.url;
        console.log(this.locationString);
      }
    });

    navService.getSearchType().subscribe(val => this.searchType = val);
    navService.getParent().subscribe(val => this.parent = val);
  }

  ngOnInit() {
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
    this.routeLocation.back()
    this.navService.returnState();
  }

  /**
   * Returns home, forgets parent state
   */
  goHome(){
    this.navService.forgetParent();
    this.router.navigate([`search/${this.searchType}/root`]);
  }

}
