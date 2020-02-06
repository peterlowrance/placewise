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
  allCategories: Category[];
  allLocations: Location[];
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
    this.displayDescendants();
    this.columns = (window.innerWidth <= this.breakpoint) ? 3 : 6;
  }

  displayDescendants() {
    const rootID = this.root ? this.root.ID : 'root';
    console.log('root ID = ' + rootID);
    if (this.selectedSearch === 'Categories') {
      this.searchService.categoryChildrenSearch(rootID).subscribe(data => this.categories = data);
      this.searchService.getAllItems().subscribe(data => this.items = data);
    } else {
      this.searchService.locationChildrenSearch(rootID).subscribe(data => this.locations = data);
      this.searchService.locationItemsSearch(rootID).subscribe(data => this.items = data);
    }
  }

  onResize(event) {
    this.columns = (event.target.innerWidth <= this.breakpoint) ? 3 : 6;
  }

  goToItem(item) {
    console.log(item);
    this.router.navigate(['/item/', item.ID]);
  }

  toggleHierarchy(event) {
    this.hierarchyItems = event.value === 'Categories' ? this.categories : this.locations;
  }
}
