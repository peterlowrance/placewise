import {Component, OnDestroy, OnInit} from '@angular/core';
import {Item} from '../../models/Item';
import {ActivatedRoute, Router} from '@angular/router';
import {HierarchyItem} from '../../models/HierarchyItem';
import {FormControl} from '@angular/forms';
import {SearchService} from '../../services/search.service';
import {NavService} from '../../services/nav.service';
import {Subscription} from 'rxjs';
import {AuthService} from 'src/app/services/auth.service';
import * as Fuse from 'fuse.js';
import {AdminService} from 'src/app/services/admin.service';
import {MatDialog} from '@angular/material/dialog';
import { trigger, state, style, transition, animate, keyframes} from '@angular/animations';

/**
 *
 * TODO: displays multiple items on startup in layer with items, problem with calling
 * displayDescendents once and then loadLevel (which calls displayDescendents)
 *
 */

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css'],
  animations:[
    trigger('button-extention-item', [
      state('shrunk', style({width: '40px', visibility: 'hidden', pointerEvents: 'none'})),
      state('extended', style({width: '80px', visibility: 'visible', pointerEvents: 'auto'})),
      transition('shrunk <=> extended', animate('300ms'))
    ]),
    trigger('button-extention-hierarchy', [
      state('shrunk', style({width: '40px', visibility: 'hidden', pointerEvents: 'none'})),
      state('extended', style({width: '140px', visibility: 'visible', pointerEvents: 'auto'})),
      transition('shrunk <=> extended', animate('300ms'))
    ])
  ]
})
export class HomeComponent implements OnInit, OnDestroy {
  control = new FormControl();

  selectedSearch = 'Categories';
  hierarchyItems: HierarchyItem[];
  root: HierarchyItem;
  items: Item[];
  columns: number;
  previousSearch = '';
  previousSearchRoot = '';
  isLoading = false;

  typeSub: Subscription;
  parentSub: Subscription;
  returnSub: Subscription;

  /**The user's role, used for fab loading */
  role: string = '';

  /**Admin fab open direction */
  direction = 'left';
  /**Admin fab open animation type */
  animation = 'fling';
  /**Admin fab spin */
  spin = true;
  /**Admin fab icon */
  ico = 'add';
  miniFabState = 'shrunk'
  itemSearchOptions = {
    shouldSort: true,
    keys: ['name', 'tags', 'attributes.value'],
    distance: 50,
    threshold: .5
  };
  hierarchySearchOptions = {
    shouldSort: true,
    keys: ['name'],
    distance: 50,
    threshold: .5
  };

  constructor(
    private navService: NavService,
    private searchService: SearchService,
    private router: Router,
    private route: ActivatedRoute,
    private authService: AuthService,
    private adminService: AdminService,
    public dialog: MatDialog) {
    // subscribe to nav state
    this.returnSub = this.navService.getReturnState().subscribe(
      val => {
        if (val && this.root) { // if we returned
          this.navigateUpHierarchy();
        }
      }
    );

    // subscribe to change keeping
    this.typeSub = this.navService.getSearchType().subscribe(val => {
      this.selectedSearch = val;
    });
    // change if parent is different
    this.parentSub = this.navService.getParent().subscribe(val => {
        this.root = val;
      }
    );
  }

  ngOnDestroy() {
    this.parentSub.unsubscribe();
    this.typeSub.unsubscribe();
    this.returnSub.unsubscribe();
  }

  ngOnInit() {
    // Get the url and set the selectedSearch
    const urlID = this.route.snapshot.paramMap.get('id');
    this.selectedSearch = this.route.snapshot.paramMap.get('selectedHierarchy') === 'categories' ? 'Categories' : 'Locations';
    // Load the current level
    this.loadLevel(urlID, this.selectedSearch);

    this.determineCols();
    // Get role
    this.authService.getRole().subscribe(
      val => this.role = val
    );
  }

  navigateUpHierarchy() {
    const urlID = this.route.snapshot.paramMap.get('id');
    const urlSS = this.route.snapshot.paramMap.get('selectedHierarchy') === 'categories' ? 'Categories' : 'Locations';
    this.loadLevel(this.root ? this.root.parent : 'root', this.selectedSearch);
  }

  /**
   * Load the items and category/locations that directly descend from the root
   * @param rootID root to display children of
   * @param selectedSearch category or location
   */
  loadLevel(rootID: string, selectedSearch: string) {
    this.selectedSearch = selectedSearch;
    this.navService.setSearchType(this.selectedSearch);
    const appropriateHierarchy = selectedSearch === 'Categories' ? this.searchService.getCategory(rootID) : this.searchService.getLocation(rootID);
    appropriateHierarchy.subscribe(root => {
      this.root = root;
      this.setNavParent(this.root);
      this.displayDescendants(root, this.selectedSearch === 'Categories');
    });
  }

  /**
   * Sets the nav parent field of the nav controller
   * @param parent parent hierarchy item
   */
  private setNavParent(parent: HierarchyItem) {
    this.navService.setParent(parent);
  }

  /**
   * Sets the nav type field of the nav controller
   * @param type string search type
   */
  private setNavType(type: string) {
    this.navService.setSearchType(type);
  }

  displayDescendants(root: HierarchyItem = this.root, isCategory = this.selectedSearch === 'Categories') {
    this.hierarchyItems = [];
    this.searchService.getDescendantsOfRoot(root ? root.ID : 'root', isCategory).subscribe(descendants => {
      this.hierarchyItems = descendants;
    });
    // Load items that descend from root
    if (root && root.items) {
      this.displayItems(root);
    }
  }

  // This is called every time the carrently viewed root is updated
  displayItems(root: HierarchyItem) {
    console.log("egg");
    this.items = [];
    if (root.items) {
      // For each itemID descending from root, get the item from the data and added to the global items array
      console.log(JSON.stringify(root));
      for (const itemID of root.items) {
        this.searchService.getItem(itemID).subscribe(returnedItem => {
          if (returnedItem !== null && typeof returnedItem !== 'undefined') {
            let itemFound = false;
            console.log(returnedItem.name);
            
            // Update the item if already displayed
            for(let item in this.items){
              if(this.items[item].ID === returnedItem.ID){
                this.items[item] = returnedItem;
                itemFound = true;
                break;
              }
            }

            // Add it if not found, and keep it in sorted order
            if(!itemFound){
              let newItemNameCapped = returnedItem.name.toUpperCase();
              if(this.items.length === 0){
                this.items.push(returnedItem);
              }
              else if(this.items[this.items.length-1].name.toUpperCase() < newItemNameCapped){
                this.items.splice(this.items.length, 0, returnedItem);
              }
              else {
                for(let item in this.items){
                  if(newItemNameCapped < this.items[item].name.toUpperCase()){
                    this.items.splice(parseInt(item), 0, returnedItem);
                    break;
                  }
                }
              }
            }
            
          }

        });
      }
    }
  }

  onResize(event) {
    this.determineCols();
  }

  determineCols(fontSize: number = this.getFontSize(), width = document.body.clientWidth) {
    const fontLine = fontSize * 7.5; // Sets max characters (but not directly) on a line
    const calcWidth = width > (fontSize*60) ? fontSize*60 : width;
    this.columns = Math.floor(calcWidth / fontLine * 0.96);
  }

  getFontSize() {
    const textField = document.documentElement;
    const style = window.getComputedStyle(textField, null).getPropertyValue('font-size');
    return parseFloat(style);
  }

  goToItem(item: Item) {
    this.router.navigate(['/item/', item.ID]);
  }

  goToHierarchy(item: HierarchyItem) {
    this.control.setValue('');
    //this.searchTextChange('');
    this.root = item;
    window.history.pushState(null, null, 'search/' + this.selectedSearch.toLowerCase() + '/' + item.ID);
    this.setNavParent(item);
    this.displayDescendants();
  }

  toggleHierarchy(event) {
    this.control.setValue('');
    this.searchTextChange('');
    window.history.pushState(null, null, 'search/' + event.value.toLowerCase() + '/' + (this.root ? this.root.ID : 'root'));
    this.setNavType(event.value);
    this.loadLevel('root', event.value);
  }

  /**Toggles the admin fab icon */
  toggleIco() {
    this.ico = this.ico === 'add' ? 'close' : 'add';
    this.miniFabState = this.ico === 'add' ? 'shrunk' : 'extended';
  }

  /**Adds an item to the current depth */
  addItem() {
    if (this.ico === 'close') {
      this.toggleIco();
    }
    // add the item
    let category = 'root';
    let location = 'root';
    // to category
    if (this.selectedSearch === 'Categories') {
      category = this.root.ID;
    } else { // add to locations
      location = this.root.ID;
    }
    this.adminService.createItemAtLocation('NEW ITEM', '', [], category, '../../../assets/notFound.png', location).subscribe(id => {
      this.router.navigate(['/item/' + id]);
    });
  }

  /** Adds a hierarchy item to the current depth */
  addHierarchy() {
    if (this.ico === 'close') {
      this.toggleIco();
    }

    if (this.selectedSearch === 'Categories') {

      this.adminService.addCategory({
        name: 'NEW CATEGORY',
        parent: this.root.ID,
        children: [],
        items: []
      } as HierarchyItem, this.root.ID).subscribe(id => {
        this.router.navigate(['/hierarchyItem/categories/' + id]);
      });
    }
    else {

      this.adminService.addLocation({
        name: 'NEW LOCATION',
        parent: this.root.ID,
        children: [],
        items: []
      } as HierarchyItem, this.root.ID).subscribe(id => {
        this.router.navigate(['/hierarchyItem/locations/' + id]);
      });
    }
  }

  clearSearch(event = ''){
    console.log("HIKE: " + event);
    if(event === ''){
      this.items = [];
      this.control.setValue('');
      this.displayDescendants(this.root, this.selectedSearch === 'Categories');
    }
  }

  searchTextChange(event) {
    if (event === '') {
      return;
    } else { // Otherwise, get all descendant hierarchy items and items and fuzzy match them
      this.isLoading = true;
      this.searchService.getAllDescendantHierarchyItems(this.root.ID, this.selectedSearch === 'Categories').subscribe(hierarchyItems => {
        this.searchService.getAllDescendantItems(this.root, hierarchyItems).subscribe(items => {
          // Search items
          const itemSearcher = new Fuse(items, this.itemSearchOptions);
          this.items = itemSearcher.search(event);
          console.log('no');
          this.isLoading = false;
        });
        // Search hierarchy items
        const hierarchySearcher = new Fuse(hierarchyItems, this.hierarchySearchOptions);
        this.hierarchyItems = hierarchySearcher.search(event);
      });
    }
    this.previousSearch = event;
    this.previousSearchRoot = this.root.ID;
  }
}
