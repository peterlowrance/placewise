import {Component, OnInit} from '@angular/core';
import {SearchInterfaceService} from '../../services/search-interface.service';
import {Item} from '../../models/Item';
import {Router} from '@angular/router';
import {HierarchyItem} from '../../models/HierarchyItem';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css']
})
export class HomeComponent implements OnInit {

  selectedSearch = 'Categories';
  hierarchyItems: HierarchyItem[];
  items: Item[];
  columns: number;
  breakpoint = 1024;

  constructor(private searchService: SearchInterfaceService, private router: Router) {
  }

  ngOnInit() {
    // Dummy data
    this.searchService.search('testSearch').subscribe(item => this.items = item);
    /*for (let i = 0; i < 10; i++) {
      this.hierarchyItems.push('hierarchy ' + i);
      this.items.push('item' + i);
    }*/
    this.columns = (window.innerWidth <= this.breakpoint) ? 3 : 6;
  }

  onResize(event) {
    this.columns = (event.target.innerWidth <= this.breakpoint) ? 3 : 6;
  }

  goToItem(event, item) {
    this.router.navigate(['/item/', item.ID]);
  }
}
