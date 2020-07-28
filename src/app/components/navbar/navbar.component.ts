import {Component, OnInit} from '@angular/core';
import {NavigationEnd, Router} from '@angular/router';
import {Location} from '@angular/common';

import {NavService} from '../../services/nav.service';
import {HierarchyItem} from 'src/app/models/HierarchyItem';
import {AuthService} from 'src/app/services/auth.service';
import { Console } from 'console';
import { SearchService } from 'src/app/services/search.service';
import { HostListener } from '@angular/core';


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

  
  @HostListener('window:popstate', ['$event'])
  onPopState(event) {
    let url: string  = event.target.location.pathname;
    if(url.startsWith('/search/') && this.locationString.startsWith('/search/')){ // Catch back button in the searching, router does not pickup on the changes
      let splitURL = url.split('/');
      if(splitURL[2] === 'categories'){
        this.searchService.getCategory(splitURL[3].replace('%20', ' ')).subscribe(cat => { // %20 replace for the conversion from the URL's spaces to string spaces
          this.navService.setSearchType('Categories');
          this.navService.setParent(cat)
        });
      }
      else if (splitURL[2] === 'locations'){
        this.searchService.getLocation(splitURL[3].replace('%20', ' ')).subscribe(loc => {
          this.navService.setSearchType('Locations');
          this.navService.setParent(loc)
        });
      }
      else {
        console.log("Malformed URL: " + splitURL[2]);
      }
    }
  }

  constructor(private routeLocation: Location, private router: Router, private navService: NavService, private authService: AuthService, private searchService: SearchService) {

    router.events.subscribe(val => {
      this.navService.setDirty(false); //Clear dirtyness anytime we leave a page
      if (val instanceof NavigationEnd) {    
        this.locationString = val.url;
      }
    });

    navService.getSearchType().subscribe(val => {
      this.searchType = val.toLowerCase()
    });
    navService.getParent().subscribe(val => {
      this.parent = val;
    });

  }

  ngOnInit() {
    this.authService.getRole().subscribe(val =>  this.role = val);
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
    } else if (this.locationString === '/users') {
      return 'moderateUsers';
    } else if (this.locationString === '/reports') {
      return 'reports';
    }
    else if(this.locationString.startsWith('/search/') && this.locationString.split('/').length === 4) {
      return '/';
    }
    else{
      return 'notFound';
    }
  }

  /**
   * Checks to see if the user has modified and not saved.
   * If so, it prompts them to make sure they know what they are doing.
   * Otherwise, just route.
   * 
   * @param route Where we want to go, based on the "route" function
   */
  routeWithCheck(route: string){
    if(this.navService.getDirty()){
      if (confirm('Are you sure you want to exit without saving?')){
        this.route(route);
      }
    } else {
      this.route(route);
    }
  }

  private route(route: string) {
    switch(route) {
      case 'back':
        this.goBack();
        break;
      case 'hierarchy':
        this.returnInHierarchy();
        break;
      case 'home':
        this.goToHierarchy('root');
        break;
      case 'modify':
        this.goToModify();
        break;
      default:
        this.router.navigateByUrl(route);
    }
  }

  /**
   * Goes back in the router
   */
  goBack() {
    if(this.navService.getDirty()){
      if (confirm('Are you sure you want to go back without saving?')){
        this.routeLocation.back();
      }
    } else {
      this.routeLocation.back();
    }
  }

  /**
   * Notifies the navservice that a hierarchy return was requested
   */
  returnInHierarchy() {
    if(this.parent.parent){
      this.goToHierarchy(this.parent.parent);
    }
    else {
      console.log("Unusual: There was no parent of parent.")
    }
  }

  goToHierarchy(id: string){
    if(this.searchType === 'categories'){
      this.searchService.getCategory(id).subscribe(cat => {
        this.navService.setParent(cat);
        this.router.navigate(['search/' + (this.searchType ? this.searchType : 'categories') + '/' + id]).then(confirm => {
          if(!confirm){ // Sometimes since we're going to the same component, the router will not navigate. If so, push to make sure the url gets in the history
            window.history.pushState(null, null, 'search/' + (this.searchType ? this.searchType : 'categories') + '/' + id);
          }
        });
      });
    } else {
      this.searchService.getLocation(id).subscribe(loc => {
        this.navService.setParent(loc)
        this.router.navigate(['search/' + (this.searchType ? this.searchType : 'categories') + '/' + id]).then(confirm => {
          if(!confirm){ // Sometimes since we're going to the same component, the router will not navigate. If so, push to make sure the url gets in the history
            window.history.pushState(null, null, 'search/' + (this.searchType ? this.searchType : 'categories') + '/' + id);
          }
        });
      });
    }
  }

  goToModify() {
    this.router.navigate(['hierarchyItem/' + (this.searchType === 'categories' ? 'categories' : 'locations') + '/' + this.parent.ID]);
  }

}
