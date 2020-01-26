import {Component, OnInit} from '@angular/core';
import {HierarchyItem} from '../../models/HierarchyItem';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css']
})
export class HomeComponent implements OnInit {

  selectedSearch = 'Categories';
  hierarchyItems = new Array();
  items = new Array();

  constructor() {
  }

  ngOnInit() {
    // Dummy data
    for (let i = 0; i < 10; i++) {
      this.hierarchyItems.push('hierarchy ' + i);
      this.items.push('item' + i);
    }
  }

}
