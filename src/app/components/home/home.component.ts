import {Component, OnDestroy, OnInit} from '@angular/core';
import {Item} from '../../models/Item';
import {ActivatedRoute, NavigationEnd, Router} from '@angular/router';
import {HierarchyItem} from '../../models/HierarchyItem';
import {FormControl} from '@angular/forms';
import {SearchService} from '../../services/search.service';
import {NavService} from '../../services/nav.service';
import {Subscription} from 'rxjs';
import {ImageService} from '../../services/image.service';
import * as Fuse from 'fuse.js';

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
  control = new FormControl(); // TODO research this more
  options: string[] = ['Two', 'Inch', 'Galvanized'];
  searchValue: string;

  selectedSearch = 'Categories';
  hierarchyItems: HierarchyItem[];
  root: HierarchyItem;
  items: Item[];
  allChildrenItems: Item[];
  columns: number;
  breakpoint = 1024;

  typeSub: Subscription;
  parentSub: Subscription;
  returnSub: Subscription;

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
    private route: ActivatedRoute) {
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
          this.displayDescendants('root', this.selectedSearch === 'Categories');
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
    const urlID = this.route.snapshot.paramMap.get('id');
    this.selectedSearch = this.route.snapshot.paramMap.get('selectedHierarchy') === 'categories' ? 'Categories' : 'Locations';

    this.displayDescendants(urlID, this.selectedSearch === 'Categories');

    this.loadLevel(urlID, this.selectedSearch);
    /*// get current level
    if (this.root === null) {
      this.loadLevel(urlID, this.selectedSearch);
    } else {
      this.loadLevel(this.root.ID, this.selectedSearch);
    }*/

    // Load root and set nav bar name
    if (this.selectedSearch === 'Categories') {
      this.searchService.getCategory(urlID).subscribe(data => {
        this.root = data;
        this.navService.setParent(data);
      });
    } else {
      this.searchService.getLocation(urlID).subscribe(data => {
        this.root = data;
        this.navService.setParent(data);
      });
    }
    this.columns = (window.innerWidth <= this.breakpoint) ? 3 : 6;
  }

  private navigateUpHierarchy() {
    const urlID = this.route.snapshot.paramMap.get('id');
    const urlSS = this.route.snapshot.paramMap.get('selectedHierarchy') === 'categories' ? 'Categories' : 'Locations';
    this.loadLevel(this.root.parent, this.selectedSearch);
  }

  private loadLevel(urlID: string, urlSS: string) {
    this.selectedSearch = urlSS;
    this.navService.setSearchType(this.selectedSearch);
    if (urlSS === 'Categories') {
      this.searchService.getCategory(urlID).subscribe(data => {
        this.root = data;
        this.setNavParent(this.root);
        this.displayDescendants(this.root.ID, this.selectedSearch === 'Categories');
      });
    } else {
      this.searchService.getLocation(urlID).subscribe(data => {
        this.root = data;
        this.setNavParent(this.root);
        this.displayDescendants(this.root.ID, this.selectedSearch === 'Categories');
      });
    }
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
    this.searchService.getDescendantsOfRoot(rootID ? rootID : 'root', isCategory).subscribe(data => {
      this.hierarchyItems = data;
    });
    // Load items that descend from root
    this.items = [];
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
    if (root.items) {
      for (const i of root.items) {
        this.searchService.getItem(i).subscribe(data => {
          this.items.push(data);
          this.imageService.getImage(data.imageUrl).subscribe(link => data.imageUrl = link);
        });
      }
    }
  }

  onResize(event) {
    this.columns = (event.target.innerWidth <= this.breakpoint) ? 3 : 6;
  }

  goToItem(item: Item) {
    this.router.navigate(['/item/', item.ID]);
  }

  goToHierarchy(item: HierarchyItem) {
    this.root = item;
    window.history.pushState(null, null, 'search/' + this.selectedSearch.toLowerCase() + '/' + item.ID);
    this.setNavParent(item);
    this.displayDescendants();
  }

  toggleHierarchy(event) {
    window.history.pushState(null, null, 'search/' + event.value.toLowerCase() + '/' + (this.root ? this.root.ID : 'root'));
    this.setNavType(event.value);
    this.displayDescendants(this.root ? this.root.ID : 'root', event.value === 'Categories');
  }

  searchTextChange(event) {
    this.searchService.getAllItems().subscribe(items => {
      const searcher = new Fuse(items, this.itemSearchOptions);
      this.items = searcher.search(event);
    });
    this.searchService.getAllLocations().subscribe(locations => {
      const searcher = new Fuse(locations, this.hierarchySearchOptions);
      this.hierarchyItems = searcher.search(event);
    });
  }
}
