import { Component, Input, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { DetailedReportModalData } from 'src/app/models/DetailedReportModalData';
import { Item } from 'src/app/models/Item';
import { SentReport } from 'src/app/models/SentReport';
import { AdminService } from 'src/app/services/admin.service';
import { AuthService } from 'src/app/services/auth.service';
import { SearchService } from 'src/app/services/search.service';
import { ReportDetailViewComponent } from '../report-detail-view/report-detail-view.component';

@Component({
  selector: 'app-report-list',
  templateUrl: './report-list.component.html',
  styleUrls: ['./report-list.component.css']
})
export class ReportListComponent implements OnInit {
  @Input() reports: SentReport[];
  @Input() workspaceID: string;
  @Input() singleItem?: Item;  // This is for when we're displaying reports connected to an item

  loaded: boolean = false;
  headers: string[] = ['Image','Item','User'];

  constructor(
    private searchService: SearchService,
    public dialog: MatDialog,
    private adminService: AdminService,
    private authService: AuthService
    ) { }

  ngOnInit(): void {
    console.log("HI");
    if(this.reports && this.reports.length > 0){

      if(!this.singleItem){
        console.log("HAI");
        let counter = 0;

        for(let i = 0; i < this.reports.length; i++)
        {
          this.searchService.getItem(this.workspaceID, this.reports[i].item).subscribe(z => {
            this.reports[i].trueItem = z;

            counter++;
            if(counter === this.reports.length){
              this.loadUserNames();
              this.sortReports();
              this.loaded = true;
            }
          });
        }
      }
      else {
        for(let i = 0; i < this.reports.length; i++)
        {
          this.reports[i].trueItem = this.singleItem;
        }
        this.loadUserNames();
        this.sortReports();
        this.loaded = true;
      }
      
    }
    else {
      this.loaded = true;
    }
  }

  // Only sort the reports once after all is loaded
  sortReports(){
    this.reports.sort(function(a, b) {
      if(a.timestamp > b.timestamp){
        return -1;
      }
      else if(a.timestamp < b.timestamp){
        return 1;
      }
      else {
        return 0;
      }
    });
  }

  loadUserNames(){
    // Get the name of the person that reported it
    for(let i = 0; i < this.reports.length; i++){
      this.authService.getUserInfo(this.reports[i].user).subscribe(z => {this.reports[i].userName = z.firstName + " " + z.lastName});
    }
  }

  openModal(r : SentReport)
  {

        // reset report data, ensure clicking out defaults to fail and no double send
        var reportData : DetailedReportModalData = {
          itemName:r.trueItem.name,itemID: r.trueItem.ID, reportDesc : r.desc,reportID : r.ID,toBeRemoved:false, toGoToItem: false, location: r.location
        }


        const dialogRef = this.dialog.open(ReportDetailViewComponent, {
          width: '28rem',
          data: {
            workspaceID: this.workspaceID,
            reportData: {
              itemName: reportData.itemName,
              reportDesc: reportData.reportDesc,
              reportID: reportData.reportID,
              remove: reportData.toBeRemoved,
              itemID: reportData.itemID, 
              location: r.location
            }
          }
        });

        dialogRef.afterClosed().subscribe(result => {
          reportData = result.reportData;
          // if it's valid, build and isue report, else leave
          if (reportData && reportData.toBeRemoved) {
            this.adminService.deleteReport(this.workspaceID, reportData.reportID, reportData.itemID);
          }
        });
  }

}
