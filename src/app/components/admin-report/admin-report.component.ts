import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { SearchService } from 'src/app/services/search.service';
import { AdminService } from 'src/app/services/admin.service';
import { Router, ActivatedRoute } from '@angular/router';
import { ImageService } from 'src/app/services/image.service';
import { SentReport } from 'src/app/models/SentReport';
import { DetailedReportModalData } from 'src/app/models/DetailedReportModalData';
import { MatDialog } from '@angular/material/dialog';
import { ReportDetailViewComponent } from '../report-detail-view/report-detail-view.component';
import { AuthService } from 'src/app/services/auth.service';
import { ModifyHierarchyDialogComponent } from '../modify-hierarchy-dialog/modify-hierarchy-dialog.component';
import { Subscription } from 'rxjs';
import { WorkspaceUser } from 'src/app/models/WorkspaceUser';
import { ReportService } from 'src/app/services/report.service';

@Component({
  selector: 'app-admin-report',
  templateUrl: './admin-report.component.html',
  styleUrls: ['./admin-report.component.css']
})
export class AdminReportComponent implements OnInit {
  notifiedReports: SentReport[];
  externalReports: SentReport[];
  headers: string[] = ['Image','Item','User'];
  //listeningToLocations: string[];
  //listeningToLocationNames: string[];
  numberOfAllReports = 0; // Little bit of a hack, this teels the tables when we're ready to build
  userSub: Subscription;
  workspaceID: string;

  constructor(
    private searchService: SearchService,
    private adminService: AdminService,
    private reportService: ReportService,
    private authService: AuthService,
    private router: Router,
    private route: ActivatedRoute,
    private imageService: ImageService,
    private changeDetectorRefs: ChangeDetectorRef,
    public dialog: MatDialog) { }

  ngOnInit() {
    this.workspaceID = this.route.snapshot.paramMap.get('workspaceID');

    this.reportService.getReports(this.workspaceID).subscribe(reports => {
      this.numberOfAllReports = reports.length;
      let notifiedReports = [];
      let externalReports = [];

      // First get the user
      this.authService.getUser().subscribe(user => {

        // Setup the item and if it is notified for each report
        for(let i = 0; i < reports.length; i++)
        {
          // Add to the notified section if it was for the person reading it
          if(reports[i].reportedTo && reports[i].reportedTo.indexOf(user.id) > -1){
            notifiedReports.push(reports[i]);
          }
          else {
            externalReports.push(reports[i]);
          }
        }

        this.notifiedReports = notifiedReports;
        this.externalReports = externalReports;
      })
    });
  }

  ngAfterViewInit() {
    
  }

  goToTemplates(){
    this.router.navigateByUrl("/w/" + this.workspaceID + "/reports/templates");
  }

  // confirmClear() {
  //   // reset report data, ensure clicking out defaults to fail and no double send
  //   let data = {confirm: false, desc: 'You sure you want to clear reports?'};

  //   const dialogRef = this.dialog.open(ConfirmComponent, {
  //     width: '14rem',
  //     data: {
  //       confirm: data.confirm,
  //       desc: data.desc
  //     }
  //   });
  //   dialogRef.afterClosed().subscribe(result => {if(result && result.confirm) {this.clearReports()}});
  // }


  // clearReports() {
  //   this.reports = this.adminService.clearReports(this.reports);
  // }

  /*
  editListenedLocations() {
    const dialogRef = this.dialog.open(ModifyHierarchyDialogComponent, {
      width: '45rem',
      data: {hierarchy: 'locations', singleSelection: false, parents: this.listeningToLocations}
    });
    dialogRef.afterClosed().subscribe(result => {
      if(result)
      this.adminService.setListenedReportLocations(result)
    });
  }
  */

}
