import {Component, OnInit} from '@angular/core';
import {HierarchyItem} from '../../models/HierarchyItem';
import {NestedTreeControl} from '@angular/cdk/tree';
import {SearchService} from '../../services/search.service';
import {MatTreeNestedDataSource} from '@angular/material/tree';
import {ActivatedRoute} from '@angular/router';
import {ReportDialogComponent} from '../report-dialog/report-dialog.component';
import {MatDialog} from "@angular/material/dialog";
import {EditHierarchyDialogComponent} from "../edit-hierarchy-dialog/edit-hierarchy-dialog.component";
import {BehaviorSubject, of, zip} from "rxjs";
import {map} from "rxjs/operators";

interface TreeHierarchyItem extends HierarchyItem {
  realChildren?: TreeHierarchyItem[];
}

@Component({
  selector: 'app-modify-hierarchy',
  templateUrl: './modify-hierarchy.component.html',
  styleUrls: ['./modify-hierarchy.component.css']
})
export class ModifyHierarchyComponent implements OnInit {
  isCategory: boolean;
  treeControl = new NestedTreeControl<TreeHierarchyItem>(node => {
    // If you have real children, return them. Otherwise fetch children from database
    this.searchService.getDescendantsOfRoot(node.ID, this.isCategory).subscribe(data => node.realChildren = data);
    return node.realChildren;
  });
  dataSource = new MatTreeNestedDataSource<TreeHierarchyItem>();
  dataChange = new BehaviorSubject<TreeHierarchyItem[]>([]);

  // toTree = (h: HierarchyItem) => ({name: h.name, imageUrl: h.imageUrl, children: [], ID: h.ID});

  hasNoContent = (_: number, nodeData: TreeHierarchyItem) => nodeData.name === '';

  hasChild = (_: number, node: TreeHierarchyItem) => (!!node.children && node.children.length > 0) || (!!node.realChildren && node.realChildren.length > 0);

  constructor(private searchService: SearchService, private route: ActivatedRoute, public dialog: MatDialog) {
  }

  ngOnInit() {
    this.isCategory = this.route.snapshot.paramMap.get('selectedHierarchy') === 'categories';
    // this.treeControl = new NestedTreeControl<HierarchyItem>(node => this.searchService.getDescendantsOfRoot(node.ID, isCategory));
    this.searchService.getDescendantsOfRoot('root', this.isCategory).subscribe(items => {
      // this.dataSource.data = items;
      this.dataChange.subscribe(x => {
        this.dataSource.data = null;
        this.dataSource.data = x;
      });
      this.dataChange.next(items);
    });
  }

  refreshTree() {
    const data = this.dataSource.data;
    this.dataSource.data = null;
    this.dataSource.data = data;
  }

  editItem(node: TreeHierarchyItem) {
    console.log(node.realChildren);
    console.log(node.children);
    this.searchService.getDescendantsOfRoot(node.ID, this.isCategory).subscribe(d => console.log(d));
    const newItem: TreeHierarchyItem = {
      name: 'test',
      ID: '1234',
      children: [],
      realChildren: [],
      items: []
    };
    if (!node.realChildren) {
      node.realChildren = [newItem];
    } else {
      node.realChildren.push(newItem);
    }
    if (!this.treeControl.isExpanded(node)) {
      this.treeControl.expand(node);
    }
    this.dataChange.next(this.dataChange.value);
    // this.treeControl.dataNodes.find(element => element.ID === node.ID).children.push('root');
    // this.treeControl.collapseAll();
    const dialogRef = this.dialog.open(EditHierarchyDialogComponent, {
      width: '75%',
      data: {
        name: node.name,
        imageUrl: node.imageUrl
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        console.log(result);
      }
      /*this.errorDesc = result;
      // if it's valid, build and isue report, else leave
      if (this.errorDesc.valid) {
        this.report.description = this.errorDesc.desc;
        this.report.item.name = this.item.name;
        this.report.item.ID = this.item.ID;
        this.report.item.imageUrl = this.item.imageUrl;
        // TODO: input reporter name from auth service
        // this.report.reporter
        this.report.reportDate = new Date().toDateString();
      }*/
    });
  }
}
