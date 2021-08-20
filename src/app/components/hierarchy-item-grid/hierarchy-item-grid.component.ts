import { Component, ElementRef, EventEmitter, Input, OnInit, Output, ViewChild } from '@angular/core';
import { HierarchyItem } from 'src/app/models/HierarchyItem';
import { HierarchyLocation } from 'src/app/models/Location';

@Component({
  selector: 'app-hierarchy-item-grid',
  templateUrl: './hierarchy-item-grid.component.html',
  styleUrls: ['./hierarchy-item-grid.component.css']
})
export class HierarchyItemGridComponent implements OnInit {
  @Input() hierarchyItemList: HierarchyItem[];
  @Input() fontSize: number = 16;
  @Input() insideLocation: HierarchyLocation;  // Used if we are listing out items in bins
  @Output() clickedHierarchy = new EventEmitter<HierarchyItem>();
  @ViewChild("fullGrid") fullGrid: ElementRef;

  columns: number;
  type: string;

  constructor() { }

  ngOnInit(): void {
    this.determineCols();

    if(this.hierarchyItemList && this.hierarchyItemList.length > 0){
      this.type = this.hierarchyItemList[0].type;
    }
  }

  onResize(event) {
    this.determineCols();
  }

  goToHierarchyItem(hierItem: HierarchyItem){
    this.clickedHierarchy.next(hierItem);
  }

  determineCols(width = document.body.clientWidth) {
    const fontLine = this.fontSize * 20; // Sets max characters (but not directly) on a line
    const calcColumns = Math.floor(width / fontLine * 0.96);
    this.columns = calcColumns > 3 ? 3 : calcColumns;
  }

}
