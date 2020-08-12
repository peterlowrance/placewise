import { Component, OnInit } from '@angular/core';
import { SearchService } from 'src/app/services/search.service';
import { AdminService } from 'src/app/services/admin.service';
import { Router, ActivatedRoute } from '@angular/router';
import { ImageService } from 'src/app/services/image.service';
import { SentReport } from 'src/app/models/SentReport';
import { DetailedReportModalData } from 'src/app/models/DetailedReportModalData';
import { MatDialog } from '@angular/material';
import { ReportDetailViewComponent } from '../report-detail-view/report-detail-view.component';
import { AuthService } from 'src/app/services/auth.service';
import { ConfirmComponent } from '../confirm/confirm.component';

@Component({
  selector: 'app-admin-report',
  templateUrl: './admin-report.component.html',
  styleUrls: ['./admin-report.component.css']
})
export class AdminReportComponent implements OnInit {
  reports: SentReport[];
  headers: string[] = ['Image','Item','User'];
  listeningToLocations: string[];

  constructor(
    private searchService: SearchService,
    private adminService: AdminService,
    private authService: AuthService,
    private router: Router,
    private route: ActivatedRoute,
    private imageService: ImageService,
    public dialog: MatDialog) { }

  ngOnInit() {
    this.adminService.getReports().subscribe(x => {this.reports = x;
      for(let i = 0; i < this.reports.length; i++)
      {
        this.searchService.getItem(this.reports[i].item).subscribe(z => {
          this.reports[i].trueItem = z;
        })
        this.authService.getUserInfo(this.reports[i].user).subscribe(z => this.reports[i].userName = z.firstName + " " + z.lastName);
      }
    });


    this.authService.getAuth().subscribe(info => {
      this.adminService.getListenedReportLocations(info.uid).subscribe(locations => {
        this.listeningToLocations = locations;
      });
    })
  }


  openModal(r : SentReport )
  {
        // reset report data, ensure clicking out defaults to fail and no double send
        var reportData : DetailedReportModalData = {
          itemName:r.trueItem.fullTitle,itemID: r.trueItem.ID, reportDesc : r.desc,reportID : r.ID,toBeRemoved:false, toGoToItem: false
        }


        const dialogRef = this.dialog.open(ReportDetailViewComponent, {
          width: '28rem',
          data: {
            itemName: reportData.itemName,
            reportDesc: reportData.reportDesc,
            reportID: reportData.reportID,
            remove: reportData.toBeRemoved,
            itemID: reportData.itemID
          }
        });

        dialogRef.afterClosed().subscribe(result => {
          reportData = result;
          // if it's valid, build and isue report, else leave
          if (reportData && reportData.toBeRemoved) {
            this.adminService.deleteReport(reportData.reportID);
          }
        });
  }

  confirmClear() {
    // reset report data, ensure clicking out defaults to fail and no double send
    let data = {confirm: false, desc: 'You sure you want to clear reports?'};

    const dialogRef = this.dialog.open(ConfirmComponent, {
      width: '14rem',
      data: {
        confirm: data.confirm,
        desc: data.desc
      }
    });
    dialogRef.afterClosed().subscribe(result => {if(result && result.confirm) {this.clearReports()}});
  }


  clearReports() {
    this.reports = this.adminService.clearReports(this.reports);
  }

}
