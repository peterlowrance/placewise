import {Component, OnInit} from '@angular/core';
import {Item} from '../../models/Item';
import {ActivatedRoute, Router} from '@angular/router';
import {HierarchyItem} from '../../models/HierarchyItem';
import {Category} from '../../models/Category';
// import {Location} from '../../models/Location';
import {FormControl} from '@angular/forms';
import {SearchService} from '../../services/search.service';
import {Location} from '@angular/common';
import {NavService} from '../../services/nav.service';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css']
})
export class HomeComponent implements OnInit {
  /*control = new FormControl(); // TODO research this more
  options: string[] = ['Two', 'Inch', 'Galvanized'];
  searchValue: string;*/

  selectedSearch = 'Locations';
  categories: HierarchyItem[];
  locations: HierarchyItem[];
  hierarchyItems: HierarchyItem[];
  root: HierarchyItem;
  items: Item[];
  columns: number;
  breakpoint = 1024;

  constructor(
    private navService: NavService,
    private searchService: SearchService,
    private router: Router,
    private route: ActivatedRoute) {
    //subscribe to nav state
    this.navService.returnClick.subscribe(
      val => {
        if (val){ //if we returned
          this.navigateUpHierarchy();
        }
      }
    )

    //subscribe to change keeping
    this.navService.searchType.subscribe(val => {this.selectedSearch = val;})
    //change if parent is different
    this.navService.parent.subscribe(val => {
      this.root = val;
      console.log(this.navService.parent.value);
    }
    )
  }

  ngOnInit() {
    const urlID = this.route.snapshot.paramMap.get('id');
    const urlSS = this.route.snapshot.paramMap.get('selectedHierarchy') === 'categories' ? 'Categories' : 'Locations';

    // Init data from firebase
    this.searchService.getAllCategories().subscribe(data => {
      this.categories = data;
      this.searchService.getAllLocations().subscribe(loc => {
        this.locations = loc;

        // this.displayDescendants(urlID, urlSS);

        //get current level
        if(this.root === null) this.loadLevel(urlID, urlSS);
        else this.loadLevel(this.root.ID, this.selectedSearch);
      });
    });

    this.columns = (window.innerWidth <= this.breakpoint) ? 3 : 6;
  }

  private navigateUpHierarchy(){
    const urlID = this.route.snapshot.paramMap.get('id');
    const urlSS = this.route.snapshot.paramMap.get('selectedHierarchy') === 'categories' ? 'Categories' : 'Locations';
    this.loadLevel(this.root.parent, this.selectedSearch);
  }

  private loadLevel(urlID: string, urlSS: string){
    this.selectedSearch = urlSS;
    this.navService.setSearchType(this.selectedSearch);
    if (urlSS === 'Categories') {
      this.searchService.getCategory(urlID).subscribe(data => {
        this.root = data;
        this.setNavParent(this.root);
        this.displayDescendants(this.root.ID, this.selectedSearch);
      });
    } else {
      this.searchService.getLocation(urlID).subscribe(data => {
        this.root = data;
        this.setNavParent(this.root);
        this.displayDescendants(this.root.ID, this.selectedSearch);
      });
    }
  }

  /**
   * Sets the nav parent field of the nav controller
   * @param parent parent hierarchy item
   */
  private setNavParent(parent: HierarchyItem){
    this.navService.setParent(parent);
  }

    /**
   * Sets the nav type field of the nav controller
   * @param type string search type
   */
  private setNavType(type: string){
    this.navService.setSearchType(type);
  }

  displayDescendants(rootID = null, selectedSearch = this.selectedSearch) {
    if (!rootID) {
      rootID = this.root ? this.root.ID : 'root';
    }
    this.hierarchyItems = [];
    this.items = [];
    if (selectedSearch === 'Categories') {
      for (const c of this.categories) {
        if (c.parent === rootID) {
          this.hierarchyItems.push(c);
        }
      }
    } else {
      for (const l of this.locations) {
        if (l.parent === rootID) {
          this.hierarchyItems.push(l);
        }
      }
    }
    if (this.root && this.root.items) {
      for (const i of this.root.items) {
        this.searchService.getItem(i).subscribe(data => this.items.push(data));
      }
    }
  }

  onResize(event) {
    this.columns = (event.target.innerWidth <= this.breakpoint) ? 3 : 6;
  }

  goToItem(item: Item) {
    console.log(this.root);
    this.router.navigate(['/item/', item.ID]);
  }

  goToHierarchy(item: HierarchyItem) {
    this.root = item;
    // this.location.replaceState('search/' + this.selectedSearch.toLowerCase() + '/' + item.ID);
    window.history.pushState(null, null, 'search/' + this.selectedSearch.toLowerCase() + '/' + item.ID);
    this.setNavParent(item);
    this.displayDescendants();
  }

  toggleHierarchy(event) {
    // this.location.replaceState('search/' + event.value.toLowerCase() + '/' + this.root.ID);
    window.history.pushState(null, null, 'search/' + event.value.toLowerCase() + '/' + this.root.ID);
    this.displayDescendants(event.value);
  }
}
