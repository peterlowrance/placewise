import {Component, OnInit} from '@angular/core';
import {ActivatedRoute, NavigationEnd, Router} from '@angular/router';
import {Location} from '@angular/common';

import {NavService} from '../../services/nav.service';
import {HierarchyItem} from 'src/app/models/HierarchyItem';
import {AuthService} from 'src/app/services/auth.service';
import { SearchService } from 'src/app/services/search.service';
import { HostListener } from '@angular/core';
import { AdminService } from 'src/app/services/admin.service';
import { Subscription } from 'rxjs';
import { ReportService } from 'src/app/services/report.service';
import { MatDialog } from '@angular/material/dialog';
import { QRCodeLocationDialogComponent } from '../qrcode-location-dialog/qrcode-location-dialog.component';
import { QRCodeCategoryDialogComponent } from '../qrcode-category-dialog/qrcode-category-dialog.component';
import { ItemBuilderModalComponent } from '../item-builder-modal/item-builder-modal.component';
import { Category } from 'src/app/models/Category';


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
  typeForHierarchyToggleButtons: string;

  /**The user's role */
  role: string = '';

  hasReadReportsColor = 'accent';
  numberOfReports = 0;

  workspaceID: string;

  
  @HostListener('window:popstate', ['$event'])
  onPopState(event) {
    let url: string  = event.target.location.pathname;    
  }

  constructor(
    private routeLocation: Location, 
    private router: Router, 
    public dialog: MatDialog,
    private activatedRoute: ActivatedRoute,
    private navService: NavService, 
    private authService: AuthService, 
    private searchService: SearchService, 
    private adminService: AdminService,
    private reportService: ReportService) {
    // For good measure, don't pile on identical subscriptions. These are used to stop previous ones.
    let reportsSub: Subscription;
    //let authSub: Subscription;
    let reportLocationsSub: Subscription;

    router.events.subscribe(val => {
      this.navService.setDirty(false); //Clear dirtyness anytime we leave a page

      if (val instanceof NavigationEnd) {    
        this.locationString = val.url;
        
        if(this.locationString.startsWith("/w/")){
          let urlPieces = val.url.split('/');
          let workspaceID = urlPieces[2].replace("%20", " ");
          
          if(workspaceID && workspaceID !== this.workspaceID){
            this.workspaceID = workspaceID;
            this.reportService.getReportTemplates(this.workspaceID);

            if(reportLocationsSub) reportLocationsSub.unsubscribe();
                if(reportsSub) reportsSub.unsubscribe();
                reportsSub = this.reportService.getReports(this.workspaceID).subscribe(reports => {
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
                      }
                    });
                  }
              });
          }
        }

        if(this.locationString.includes('/search/')){ // Catch back button in the searching, router does not pickup on the changes
          
          
          let splitURL = this.locationString.split('/');
          console.log(splitURL);

          if(splitURL[4] === 'categories'){
            // Setup toggle button
            this.typeForHierarchyToggleButtons = 'categories';

            // Remove any parameters at the end of the URL
            let catID = splitURL[5].replace('%20', ' ');
            let foundParamsIndex = catID.indexOf('?');
            if(foundParamsIndex > -1){
              catID = catID.substring(0, foundParamsIndex);
            }

            let sub = this.searchService.getCategory(this.workspaceID, catID).subscribe(cat => { // %20 replace for the conversion from the URL's spaces to string spaces
              console.log(cat);
              this.navService.setSearchType('Categories');
              this.navService.setParent(cat)
              sub.unsubscribe();
            });
          }

          else if (splitURL[4] === 'locations'){
            // Setup toggle button
            this.typeForHierarchyToggleButtons = 'locations';

            // Remove any parameters at the end of the URL
            let locID = splitURL[5].replace('%20', ' ');
            let foundParamsIndex = locID.indexOf('?');
            if(foundParamsIndex > -1){
              locID = locID.substring(0, foundParamsIndex);
              console.log(locID);
            }

            let sub = this.searchService.getLocation(this.workspaceID, locID).subscribe(loc => {
              console.log(loc);
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
    });

    navService.getParent().subscribe(val => {
      this.parent = val;
    });

  }

  ngOnInit() {
    /*
    this.typeForSelectionButtons = this.activatedRoute.snapshot.paramMap.get('selectedHierarchy');

    this.activatedRoute.paramMap.subscribe(route => {
      this.workspaceID = route.get('workspaceID');
      console.log(this.workspaceID);
    })
    */

    this.authService.getRole().subscribe(val =>  this.role = val);
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
    } else if (this.locationString.includes('/hierarchyItem/categories')) {
      return 'category';
    } else if (this.locationString.includes('/hierarchyItem/locations')) {
      return 'location';
    } else if (this.locationString === '/users') {
      return 'moderateUsers';
    } else if (this.locationString.includes('reports')) {
      return 'reports';
    } else if (this.locationString.includes('/textSearch')) {
      return 'textSearch';
    }
    else if(this.locationString.includes('/search/')) {
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
        this.router.navigateByUrl("/w/" + this.workspaceID + "/reports");
        break;
      case 'users':
        this.router.navigateByUrl("/w/" + this.workspaceID + "/users");
        break;
      case 'textSearch':
        this.router.navigateByUrl("/w/" + this.workspaceID + "/textSearch");
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
    if(this.parent && this.parent.type === 'category'){
      this.router.navigate(['w/' + this.workspaceID + '/search/categories/' + id]).then(confirm => {
        if(!confirm){ // Sometimes since we're going to the same component, the router will not navigate. If so, push to make sure the url gets in the history
          window.history.pushState(null, null, 'w/' + this.workspaceID + '/search/categories/' + id);
        }
      });
      this.navService.setSubscribedParent(this.searchService.getCategory(this.workspaceID, id));
    } else {
      this.router.navigate(['w/' + this.workspaceID + '/search/locations/' + id]).then(confirm => {
        if(!confirm){ // Sometimes since we're going to the same component, the router will not navigate. If so, push to make sure the url gets in the history
          window.history.pushState(null, null, 'w/' + this.workspaceID + '/search/locations/' + id);
        }
      });
      this.navService.setSubscribedParent(this.searchService.getLocation(this.workspaceID, id));
    }
  }

  goToModify() {
    this.router.navigate(['w/' + this.workspaceID + '/hierarchyItem/' + (this.parent.type === 'category' ? 'categories' : 'locations') + '/' + this.parent.ID]);
  }

  openQRDialog() {
    if(this.parent.type === 'category'){
      this.dialog.open(QRCodeCategoryDialogComponent, {
        width: '45rem',
        data: {workspaceID: this.workspaceID, category: this.parent}
      });
    }
    else {
      this.dialog.open(QRCodeLocationDialogComponent, {
        width: '45rem',
        data: {workspaceID: this.workspaceID, location: this.parent}
      });
    }
  }

  addItem(){
    const dialogRef = this.dialog.open(ItemBuilderModalComponent, {
      width: '480px',
      data: {
        workspaceID: this.workspaceID,
        hierarchyObj: this.parent
      }
    });
  }

  /** Adds a hierarchy item to the current depth */
  addHierarchy() {
    if (this.parent.type === 'category') {

      let categoryData: Category =
      {
        name: 'NEW CATEGORY',
        parent: this.parent.ID,
        children: [],
        items: [],
        titleFormat: [{type: "parent"}]
      }

      this.adminService.addCategory(this.workspaceID, categoryData, this.parent.ID).subscribe(id => {
        this.router.navigate(['/w/' + this.workspaceID + '/hierarchyItem/categories/' + id]);
      });
    }
    else {

      this.adminService.addLocation(this.workspaceID, {
        name: 'NEW LOCATION',
        parent: this.parent.ID,
        children: [],
        items: []
      } as HierarchyItem, this.parent.ID).subscribe(id => {
        this.router.navigate(['/w/' + this.workspaceID + '/hierarchyItem/locations/' + id]);
      });
    }
  }

  toggleHierarchy(event) {
    this.router.navigate(['/w/' + this.workspaceID + '/search/' + event.value.toLowerCase() + '/root']);
  }

}
