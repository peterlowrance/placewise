import {Component, OnInit} from '@angular/core';
import {SearchInterfaceService} from '../../services/search-interface.service';
import {Item} from '../../models/Item';
import {Router} from '@angular/router';
import {HierarchyItem} from '../../models/HierarchyItem';
import {Category} from '../../models/Category';
import {Location} from '../../models/Location';
import {FormControl} from '@angular/forms';
import {SearchService} from '../../services/search.service';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css']
})
export class HomeComponent implements OnInit {
  control = new FormControl(); // TODO research this more
  options: string[] = ['Two', 'Inch', 'Galvanized'];
  searchValue: string;

  selectedSearch = 'Categories';
  categories: Category[];
  locations: Location[];
  hierarchyItems: HierarchyItem[];
  root: HierarchyItem;
  items: Item[];
  columns: number;
  breakpoint = 1024;

  constructor(private searchService: SearchService, private router: Router) {
  }

  ngOnInit() {
    // Init data from firebase
    this.searchService.getAllCategories().subscribe(data => {
      this.categories = data;
      this.displayDescendants(this.selectedSearch);
    });
    this.searchService.getAllLocations().subscribe(data => this.locations = data);
    this.columns = (window.innerWidth <= this.breakpoint) ? 3 : 6;
  }

  displayDescendants(selectedSearch) {
    const rootID = this.root ? this.root.ID : 'root';
    this.hierarchyItems = [];
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
    this.searchService.getAllItems().subscribe(data => this.items = data);
  }

  onResize(event) {
    this.columns = (event.target.innerWidth <= this.breakpoint) ? 3 : 6;
  }

  goToItem(item) {
    this.router.navigate(['/item/', item.ID]);
  }

  toggleHierarchy(event) {
    this.displayDescendants(event.value);
  }
}
