import {Component, OnDestroy, OnInit} from '@angular/core';
import {Item} from '../../models/Item';
import {ActivatedRoute, NavigationEnd, Router} from '@angular/router';
import {HierarchyItem} from '../../models/HierarchyItem';
import {FormControl} from '@angular/forms';
import {SearchService} from '../../services/search.service';
import {NavService} from '../../services/nav.service';
import {Subscription} from 'rxjs';
import {AuthService} from 'src/app/services/auth.service';
import {ImageService} from '../../services/image.service';
import * as Fuse from 'fuse.js';
import {AdminService} from 'src/app/services/admin.service';

/**
 *
 * TODO: displays multiple items on startup in layer with items, problem with calling
 * displayDescendents once and then loadLevel (which calls displayDescendents)
 *
 */

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css']
})
export class HomeComponent implements OnInit, OnDestroy {
  control = new FormControl();

  selectedSearch = 'Categories';
  hierarchyItems: HierarchyItem[];
  root: HierarchyItem;
  items: Item[];
  columns: number;
  previousSearch = '';

  typeSub: Subscription;
  parentSub: Subscription;
  returnSub: Subscription;

  /**The user's role, used for fab loading */
  role: string = '';

  /**Admin fab open direction */
  direction = 'up';
  /**Admin fab open animation type */
  animation = 'fling';
  /**Admin fab spin */
  spin = true;
  /**Admin fab icon */
  ico = 'add';
  itemSearchOptions = {
    shouldSort: true,
    keys: ['name', 'desc', 'tags'],
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
    private imageService: ImageService,
    private router: Router,
    private route: ActivatedRoute,
    private authService: AuthService,
    private adminService: AdminService) {
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

    // subscirbe to routing home
    this.router.events.subscribe(val => {
      if (val instanceof NavigationEnd) {
        if (this.route.snapshot.paramMap.get('id') === 'root') {
          this.navigateUpHierarchy();
        }
      }
    });
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

  private navigateUpHierarchy() {
    console.log('nav up hierarchy');
    const urlID = this.route.snapshot.paramMap.get('id');
    const urlSS = this.route.snapshot.paramMap.get('selectedHierarchy') === 'categories' ? 'Categories' : 'Locations';
    this.loadLevel(this.root ? this.root.parent : 'root', this.selectedSearch);
  }

  /**
   * Load the items and category/locations that directly descend from the root
   * @param rootID root to display children of
   * @param selectedSearch category or location
   */
  private loadLevel(rootID: string, selectedSearch: string) {
    this.selectedSearch = selectedSearch;
    this.navService.setSearchType(this.selectedSearch);
    const appropriateHierarchy = selectedSearch === 'Categories' ? this.searchService.getCategory(rootID) : this.searchService.getLocation(rootID);
    appropriateHierarchy.subscribe(root => {
      console.log('loading levell');
      this.root = root;
      this.setNavParent(this.root);
      this.displayDescendants(this.root.ID, this.selectedSearch === 'Categories');
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

  displayDescendants(rootID = this.root.ID, isCategory = this.selectedSearch === 'Categories') {
    console.log('display descendants');
    this.hierarchyItems = [];
    this.searchService.getDescendantsOfRoot(rootID ? rootID : 'root', isCategory).subscribe(descendants => {
      this.hierarchyItems = descendants;
    });
    // Load items that descend from root
    // If root exists, display it's items, otherwise get root from db first
    if (this.root && this.root.items) {
      this.displayItems(this.root);
    } else if (rootID) {
      if (isCategory) {
        this.searchService.getCategory(rootID).subscribe(rootCat => this.displayItems(rootCat));
      } else {
        this.searchService.getLocation(rootID).subscribe(rootLoc => this.displayItems(rootLoc));
      }
    }
  }

  displayItems(root: HierarchyItem) {
    console.log('displaying items');
    this.items = [];
    if (root.items) {
      // For each itemID descending from root, get the item from the data and added to the global items array
      for (const itemID of root.items) {
        this.searchService.getItem(itemID).subscribe(returnedItem => {
          this.items.push(returnedItem);
        });
      }
    }
  }

  onResize(event) {
    this.determineCols();
  }

  determineCols(fontSize: number = this.getFontSize(), width = window.innerWidth) {
    const fontLine = fontSize * 7; // Sets max characters (but not directly) on a line
    this.columns = width / fontLine;
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
    this.searchTextChange('');
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
    this.adminService.createItemAtLocation('NEW ITEM', '', [], category, '../../../assets/notFound.png', location).then(
      () => alert('Item successfully added'),
      (err) => alert('Item successfully added. Error:\n' + err)
    );
  }

  /**Adds a hierarchy item to the current depth */
  addHierarchy() {
    if (this.ico === 'close') {
      this.toggleIco();
    }
  }

  searchTextChange(event) {
    if (event === '' && this.previousSearch === '') {
      return;
    }
    // If the search is empty, load descendants normally
    if (event === '') {
      this.displayDescendants(this.root.ID, this.selectedSearch === 'Categories');
    } else { // Otherwise, get all descendant hierarchy items and items and fuzzy match them
      this.searchService.getAllDescendantHierarchyItems(this.root.ID, this.selectedSearch === 'Categories').subscribe(hierarchyItems => {
        this.searchService.getAllDescendantItems(this.root, hierarchyItems).subscribe(items => {
          // Search items
          const itemSearcher = new Fuse(items, this.itemSearchOptions);
          this.items = itemSearcher.search(event);
        });
        // Search hierarchy items
        const hierarchySearcher = new Fuse(hierarchyItems, this.hierarchySearchOptions);
        this.hierarchyItems = hierarchySearcher.search(event);
      });
    }
    this.previousSearch = event;
  }
}
