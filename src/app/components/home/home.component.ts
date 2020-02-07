import {Component, OnInit} from '@angular/core';
import {Item} from '../../models/Item';
import {ActivatedRoute, Router} from '@angular/router';
import {HierarchyItem} from '../../models/HierarchyItem';
import {Category} from '../../models/Category';
// import {Location} from '../../models/Location';
import {FormControl} from '@angular/forms';
import {SearchService} from '../../services/search.service';
import {Location} from '@angular/common';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css']
})
export class HomeComponent implements OnInit {
  /*control = new FormControl(); // TODO research this more
  options: string[] = ['Two', 'Inch', 'Galvanized'];
  searchValue: string;*/

  selectedSearch = 'Categories';
  categories: Category[];
  locations: HierarchyItem[];
  hierarchyItems: HierarchyItem[];
  root: HierarchyItem;
  items: Item[];
  columns: number;
  breakpoint = 1024;

  constructor(private searchService: SearchService, private router: Router, private location: Location, private route: ActivatedRoute) {
  }

  ngOnInit() {
    const urlID = this.route.snapshot.paramMap.get('id');
    const urlSS = this.route.snapshot.paramMap.get('selectedHierarchy') === 'categories' ? 'Categories' : 'Locations';
    // Init data from firebase
    this.searchService.getAllCategories().subscribe(data => {
      this.categories = data;
      this.displayDescendants(urlID, urlSS);
    });
    this.searchService.getAllLocations().subscribe(data => this.locations = data);

    this.columns = (window.innerWidth <= this.breakpoint) ? 3 : 6;
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
    if (this.root) {
      for (const i of this.root.items) {
        this.searchService.getItem(i).subscribe(data => this.items.push(data));
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
    this.location.replaceState('search/' + this.selectedSearch.toLowerCase() + '/' + item.ID);
    this.root = item;
    this.displayDescendants();
  }

  toggleHierarchy(event) {
    this.displayDescendants(event.value);
  }
}
