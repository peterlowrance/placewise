import {Component, OnInit} from '@angular/core';
import {NavigationEnd, Router} from '@angular/router';
import {Location} from '@angular/common';

import {NavService} from '../../services/nav.service';
import {HierarchyItem} from 'src/app/models/HierarchyItem';
import {AuthService} from 'src/app/services/auth.service';
import { SearchService } from 'src/app/services/search.service';
import { HostListener } from '@angular/core';
import { AdminService } from 'src/app/services/admin.service';
import { Subscription } from 'rxjs';


@Component({
  selector: 'app-navbar',
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.css']
})
export class NavbarComponent implements OnInit {

  /** The current location in the app */
  locationString = '/login';

  /**Reference to type of searching */

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

  hasReadReportsColor = 'accent';
  numberOfReports = 0;

  
  @HostListener('window:popstate', ['$event'])
  onPopState(event) {
    let url: string  = event.target.location.pathname;
    if(url.startsWith('/search/') && this.locationString.startsWith('/search/')){ // Catch back button in the searching, router does not pickup on the changes
      let splitURL = url.split('/');
      if(splitURL[2] === 'categories'){
        let sub = this.searchService.getCategory(splitURL[3].replace('%20', ' ')).subscribe(cat => { // %20 replace for the conversion from the URL's spaces to string spaces
          this.navService.setSearchType('Categories');
          this.navService.setParent(cat)
          sub.unsubscribe();
        });
      }
      else if (splitURL[2] === 'locations'){
        let sub = this.searchService.getLocation(splitURL[3].replace('%20', ' ')).subscribe(loc => {
          this.navService.setSearchType('Locations');
          this.navService.setParent(loc)
          sub.unsubscribe();
        });
      }
      else {
        console.log("Malformed URL: " + splitURL[2]);
      }
    }
  }

  constructor(private routeLocation: Location, private router: Router, private navService: NavService, private authService: AuthService, private searchService: SearchService, private adminService: AdminService) {

    router.events.subscribe(val => {
      this.navService.setDirty(false); //Clear dirtyness anytime we leave a page
      if (val instanceof NavigationEnd) {    
        this.locationString = val.url;
      }
    });

    navService.getParent().subscribe(val => {
      this.parent = val;
    });

  }

  ngOnInit() {
    this.authService.getRole().subscribe(val =>  this.role = val);

     // For good measure, don't pile on identical subscriptions. These are used to stop previous ones.
    let reportsSub: Subscription;
    let authSub: Subscription;
    let reportLocationsSub: Subscription;

    this.authService.getWorkspace().subscribe(workspaceInfo => {
      if(workspaceInfo && workspaceInfo.id !== ''){ // Make sure we have a workspace before subscribing to reports

        if(reportLocationsSub) reportLocationsSub.unsubscribe();
            
            if(reportsSub) reportsSub.unsubscribe();
            reportsSub = this.adminService.getReports().subscribe(reports => {
              if(reports){
                this.numberOfReports = 0;

                if(this.locationString !== '/reports'){
                  this.hasReadReportsColor = 'warn';
                }

                this.authService.getUser().subscribe(user => {
                  for(let report of reports){

                    if(report.reportedTo && report.reportedTo.indexOf(user.id) > -1){
                      this.numberOfReports++;
                    }
                    
                    /*
                    OLD NASTY SYSTEM
                    let itemSub = this.searchService.getItem(reports[reportIndex].item).subscribe(item => {
                        this.searchService.getAncestorsOf(item).subscribe(itemLocations => {
                          
                          for(let listenedIndex in locations){
                            for(let outerIndex in itemLocations){
                              for(let innerIndex in itemLocations[outerIndex]){
                                if(itemLocations[outerIndex][innerIndex].ID === locations[listenedIndex]){
                                  this.numberOfReports++;
                                  itemSub.unsubscribe();
                                  return; // Cut some CPU cycles and don't repeat current item
                                }
                              }
                            }
                          }
                          itemSub.unsubscribe(); // Don't want this messing with numbers later
                        })
                    })
                    */
                  }
                });

              }
            });
      }
    })
  }

  /**
   * Checks the current location
   * @returns a string representation of the current location in the app
   */
  checkLocation(): string {
    if (this.locationString.includes('/item/')) {
      return 'item';
    } else if (this.locationString.includes('/itemBuilder/')) {
      return 'itemBuilder';
    } else if (this.locationString === '/login') {
      return 'login';
    } else if (this.locationString === '/settings') {
      return 'settings';
    } else if (this.locationString.startsWith('/hierarchyItem/categories')) {
      return 'category';
    } else if (this.locationString.startsWith('/hierarchyItem/locations')) {
      return 'location';
    } else if (this.locationString === '/users') {
      return 'moderateUsers';
    } else if (this.locationString === '/reports') {
      return 'reports';
    } else if (this.locationString.startsWith('/textSearch')) {
      return 'textSearch';
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
  routeWithCheck(route: string){  // NO LONGER USED: Saving is now done instantly
    if(this.navService.getDirty()){
      if (confirm('Are you sure you want to exit without saving?')){
        this.route(route);
      }
    } else {
      this.route(route);
    }
  }

  route(route: string) {
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
      case 'reports':
        this.hasReadReportsColor = 'accent'; // Note: also goes to default
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
    if(this.parent && this.parent.type === 'category'){
      this.router.navigate(['search/categories/' + id]).then(confirm => {
        if(!confirm){ // Sometimes since we're going to the same component, the router will not navigate. If so, push to make sure the url gets in the history
          window.history.pushState(null, null, 'search/categories/' + id);
        }
      });
      this.navService.setSubscribedParent(this.searchService.getCategory(id));
    } else {
      this.router.navigate(['search/locations/' + id]).then(confirm => {
        if(!confirm){ // Sometimes since we're going to the same component, the router will not navigate. If so, push to make sure the url gets in the history
          window.history.pushState(null, null, 'search/locations/' + id);
        }
      });
      this.navService.setSubscribedParent(this.searchService.getLocation(id));
    }
  }

  goToModify() {
    this.router.navigate(['hierarchyItem/' + (this.parent.type === 'category' ? 'categories' : 'locations') + '/' + this.parent.ID]);
  }

}
