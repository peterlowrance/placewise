import {Component, OnInit} from '@angular/core';
import {SearchInterfaceService} from '../../services/search-interface.service';
import {Item} from '../../models/Item';
import {Router} from '@angular/router';
import {HierarchyItem} from '../../models/HierarchyItem';
import {Category} from '../../models/Category';
import {Location} from '../../models/Location';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css']
})
export class HomeComponent implements OnInit {

  selectedSearch = 'Categories';
  categories: Category[];
  locations: Location[];
  hierarchyItems: HierarchyItem[];
  items: Item[];
  columns: number;
  breakpoint = 1024;

  constructor(private searchService: SearchInterfaceService, private router: Router) {
  }

  ngOnInit() {
    // Dummy data
    this.searchService.search('testSearch').subscribe(item => this.items = item);
    const c: Category = {
      ID: 123,
      name: 'tool',
      parent: null,
      imageUrl: 'https://previews.123rf.com/images/davids47/davids471403/davids47140300419/26802642-abstract-construction-tool-on-a-white-background.jpg',
      children: []
    };
    const l: Location = {
      ID: 122,
      name: 'cabinet',
      parent: null,
      imageUrl: 'https://www.ikea.com/us/en/images/products/havsta-cabinet-with-plinth__0720107_PE732421_S5.JPG?f=s,',
      children: []
    };
    this.categories = [c, c];
    this.locations = [l];
    this.hierarchyItems = [c, c, l, l, l, l, l];

    this.columns = (window.innerWidth <= this.breakpoint) ? 3 : 6;
  }

  onResize(event) {
    this.columns = (event.target.innerWidth <= this.breakpoint) ? 3 : 6;
  }

  goToItem(event, item) {
    this.router.navigate(['/item/', item.ID]);
  }

  toggleHierarchy(event) {
    this.hierarchyItems = event.value === 'Categories' ? this.categories : this.locations;
  }
}
