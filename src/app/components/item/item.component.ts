import { Component, OnInit } from '@angular/core';
import { SearchService } from 'src/app/services/search.service';
import { Item } from 'src/app/models/Item';
import {Report} from 'src/app/models/Report';
import {ItemReportModalData} from 'src/app/models/ItemReportModalData'
import { Router, ActivatedRoute, Params } from '@angular/router';
import { SearchInterfaceService } from 'src/app/services/search-interface.service';
import {MatDialog} from '@angular/material/dialog';
import {ReportDialogComponent} from '../report-dialog/report-dialog.component'

@Component({
  selector: 'app-item',
  templateUrl: './item.component.html',
  styleUrls: ['./item.component.css']
})
export class ItemComponent implements OnInit {
  id: string; //item id
  item: Item; //item returned by id
  loading: boolean = true;  //whether the page is actively loading
  report: Report = {
    description:'',
    item:{
      ID:0,
      name:'',
      imageUrl:''
    },
    reportDate: '',
    reporter:''
  }; //user report
  errorDesc: ItemReportModalData = {valid: false, desc:''}; //user-reported error description
  expanded: boolean = false;  //is the more info panel expanded


  constructor(
    private searchService: SearchInterfaceService,
    private router: Router,
    private route: ActivatedRoute,
    public dialog: MatDialog
    ) { }

  ngOnInit() {
    //retrieve id
    this.id = this.route.params['id'];

    //get the item from the id
    this.searchService.getItem(+this.id).subscribe(item => this.item = item);
    
  }

  toggleMoreInfo(){
    this.expanded = !this.expanded;
  }

  createReport(){
    //reset report data, ensure clicking out defaults to fail and no double send
    this.errorDesc = {valid:false,desc:''};

    const dialogRef = this.dialog.open(ReportDialogComponent, {
      width: '240px',
      data: {
        valid: this.errorDesc.valid,
        desc: this.errorDesc.desc
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      this.errorDesc = result;
      //if it's valid, build and isue report, else leave
      if(this.errorDesc.valid){
        this.report.description=this.errorDesc.desc;
        this.report.item.name=this.item.name;
        this.report.item.ID=this.item.ID;
        this.report.item.imageUrl=this.item.imageUrl;
        //TODO: input reporter name from auth service
        //this.report.reporter
        this.report.reportDate = new Date().toDateString();

        //TODO: issue report
        console.log(this.report);
      }
    });
  }

}
