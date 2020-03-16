import { Component, OnInit } from '@angular/core';
import { SearchService } from 'src/app/services/search.service';
import { AdminService } from 'src/app/services/admin.service';
import { Router, ActivatedRoute } from '@angular/router';
import { ImageService } from 'src/app/services/image.service';
import { SentReport } from 'src/app/models/SentReport';
import { DetailedReportModalData } from 'src/app/models/DetailedReportModalData';
import { MatDialog } from '@angular/material';
import { ReportDetailViewComponent } from '../report-detail-view/report-detail-view.component';

@Component({
  selector: 'app-admin-report',
  templateUrl: './admin-report.component.html',
  styleUrls: ['./admin-report.component.css']
})
export class AdminReportComponent implements OnInit {
  reports: SentReport[];
  constructor(
    private searchService: SearchService,
    private adminService: AdminService,
    private router: Router,
    private route: ActivatedRoute,
    private imageService: ImageService,
    public dialog: MatDialog) { }

  ngOnInit() {
    this.adminService.getReports().subscribe(x => {this.reports = x; 
      for(let i = 0; i < this.reports.length; i++)
      {
        this.searchService.getItem(this.reports[i].item).subscribe(z =>{
          this.reports[i].trueItem = z;
        })
      }
    });
  }

  
  openModal(r : SentReport )
  {
        // reset report data, ensure clicking out defaults to fail and no double send
        var reportData : DetailedReportModalData = {
          itemName:r.trueItem.name,reportDesc : r.desc,reportID : r.ID,remove:false
        }

        const dialogRef = this.dialog.open(ReportDetailViewComponent, {
          width: '240px',
          data: {
            itemName: reportData.itemName,
            reportDesc: reportData.reportDesc,
            reportID: reportData.reportID,
            remove: reportData.remove
          }
        });
    
        dialogRef.afterClosed().subscribe(result => {
          reportData = result;
          // if it's valid, build and isue report, else leave
          if (reportData.remove) {
            this.adminService.deleteReport(reportData.reportID);
          }
        });
  }

  clearReports() {
    this.adminService.clearReports(this.reports);
  }

}
