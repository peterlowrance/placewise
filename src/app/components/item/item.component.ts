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

  parentLists: string[];

  // tree components from material source
  // TODO this needs to be changed since node.children is just a bunch of id's
  // treeControl = new NestedTreeControl<HierarchyItem>(node => node.children);

  // dataSource = new MatTreeNestedDataSource<HierarchyItem>();

  // hasChild = (_: number, node: HierarchyItem) => !!node.children && node.children.length > 0;

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
      this.searchService.getAncestorsOfItem(item.ID);
      // TODO this will have to be done with a call to get all locations and then filtering them
      // this.dataSource.data = this.item.parentLocations;
    });

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
