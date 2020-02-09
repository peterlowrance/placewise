// adapted tree control from https://material.angular.io/components/tree/examples
import {Component, OnInit} from '@angular/core';
import {MatTreeNestedDataSource} from '@angular/material/tree';
import {Item} from 'src/app/models/Item';
import {Report} from 'src/app/models/Report';
import {ItemReportModalData} from 'src/app/models/ItemReportModalData';
import {ActivatedRoute, Router} from '@angular/router';
import {SearchService} from 'src/app/services/search.service';
import {MatDialog} from '@angular/material/dialog';
import {ReportDialogComponent} from '../report-dialog/report-dialog.component';
import {HierarchyItem} from 'src/app/models/HierarchyItem';
import {NestedTreeControl} from '@angular/cdk/tree';
import { Observable, of } from 'rxjs';


interface TreeNode{
  name: string;
  imageUrl: string;
  children: TreeNode[];
  ID: string;
}

@Component({
  selector: 'app-item',
  templateUrl: './item.component.html',
  styleUrls: ['./item.component.css']
})
export class ItemComponent implements OnInit {
  id: string; // item id
  item: Item; // item returned by id
  loading = true;  // whether the page is actively loading
  report: Report = {
    description: '',
    item: {
      ID: '0',
      name: '',
      imageUrl: ''
    },
    reportDate: '',
    reporter: ''
  }; // user report
  errorDesc: ItemReportModalData = {valid: false, desc: ''}; // user-reported error description
  expanded = false;  // is the more info panel expanded

  //Parent of heirarchy, does nothing now
  parent: TreeNode = {name: null, imageUrl: null, children: null, ID: null};
  //category of the item
  category: HierarchyItem;

  // tree components from material source
  treeControl = new NestedTreeControl<TreeNode>(node => node.children);

  dataSource = new MatTreeNestedDataSource<TreeNode>();

  toTree = (h: HierarchyItem) => {return {name: h.name, imageUrl: h.imageUrl, children: [], ID: h.ID}};

  hasChild = (_: number, node: TreeNode) => !!node.children && node.children.length > 0;

  constructor(
    private searchService: SearchService,
    private router: Router,
    private route: ActivatedRoute,
    public dialog: MatDialog
  ) {
  }

  ngOnInit() {
    // retrieve id
    this.id = this.route.snapshot.paramMap.get('id');
    console.log('id is ' + this.id);

    // get the item from the id
    this.searchService.getItem(this.id).subscribe(item => {
      // get the item ref
      this.item = item;
      //get all locations and filter
      this.searchService.getAncestorsOfItem(item.ID).subscribe(hierarchy => {
        //need to loop over first elements, pop off, and combine any like
        //first pop off all top level locations, those are the root
        for(let h of hierarchy){
            let head = this.toTree(h.pop());
            this.parent = this.parent.ID === null ? head : this.parent;
            //go over all list and keep building node list
            this.parent.children.push(this.convertList(h));
        }

        //now collapse duplicates
        this.collapseNodes(this.parent);

        this.dataSource.data = this.parent.children;
      });

      //get the category information
      this.searchService.getCategory(item.category).subscribe(val => this.category = val);
    });

  }

  convertList(items: HierarchyItem[]): TreeNode {
    if(items.length === 0) return null;
    else{
      var level = this.toTree(items.pop());
      let child = this.convertList(items);

      //add if not null
      if(child) level.children.push(child);
      return level;
    }
  }

  /**
   * Collapses a single level of the node hierarchy
   * Adapted with insight from: https://stackoverflow.com/questions/16747798/delete-duplicate-elements-from-an-array
   * @param node 
   */
  collapseNodes(node: TreeNode){
    var m = {}, newarr = []
    for (var i=0; i<node.children.length; i++) {
      var v = node.children[i];
      if (!m[v.ID]) {
        m[v.ID]=v;
        newarr.push(v);
      }
      else{
        m[v.ID].children = m[v.ID].children.concat(v.children);
      }
    }
    node.children = newarr;
    for(let child of node.children){
      this.collapseNodes(child);
    }
  }

  toggleMoreInfo() {
    this.expanded = !this.expanded;
  }

  createReport() {
    // reset report data, ensure clicking out defaults to fail and no double send
    this.errorDesc = {valid: false, desc: ''};

    const dialogRef = this.dialog.open(ReportDialogComponent, {
      width: '240px',
      data: {
        valid: this.errorDesc.valid,
        desc: this.errorDesc.desc
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      this.errorDesc = result;
      // if it's valid, build and isue report, else leave
      if (this.errorDesc.valid) {
        this.report.description = this.errorDesc.desc;
        this.report.item.name = this.item.name;
        this.report.item.ID = this.item.ID;
        this.report.item.imageUrl = this.item.imageUrl;
        // TODO: input reporter name from auth service
        // this.report.reporter
        this.report.reportDate = new Date().toDateString();

        // TODO: issue report
        console.log(this.report);
      }
    });
  }

}
