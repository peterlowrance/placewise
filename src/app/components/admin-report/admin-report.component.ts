import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
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
import { ModifyHierarchyDialogComponent } from '../modify-hierarchy-dialog/modify-hierarchy-dialog.component';
import { Subscription } from 'rxjs';
import { WorkspaceUser } from 'src/app/models/WorkspaceUser';

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

  constructor(
    private searchService: SearchService,
    private adminService: AdminService,
    private authService: AuthService,
    private router: Router,
    private route: ActivatedRoute,
    private imageService: ImageService,
    private changeDetectorRefs: ChangeDetectorRef,
    public dialog: MatDialog) { }

  ngOnInit() {
    this.adminService.getReports().subscribe(reports => {
      this.numberOfAllReports = reports.length;
      this.notifiedReports = [];
      this.externalReports = [];

      // First get the user
      this.authService.getUser().subscribe(user => {

        // Setup the item and if it is notified for each report
        for(let i = 0; i < reports.length; i++)
        {
          this.searchService.getItem(reports[i].item).subscribe(z => {
            reports[i].trueItem = z;

            /*
            OLD NOTIFICATION SYSTEM

            this.searchService.getAncestorsOf(z).subscribe(itemLocations => {
              let found = false;
              for(let location = 0; location < locations.length && !found; location++){
                for(let outerIndex = 0; outerIndex < itemLocations.length && !found; outerIndex++){
                  for(let innerIndex = 0; innerIndex < itemLocations[outerIndex].length && !found; innerIndex++){
                    if(locations[location] === itemLocations[outerIndex][innerIndex].ID){
                      found = true;
                      this.relevantReports.push(reports[i]);
                    }
                  }
                }
              }
              if(!found){
                this.externalReports.push(reports[i]);
              }

              // JANKY, but we cannot load this before getting ancestors, this messes with cache and that we don't have getAncestorsOf
              // Setup to account for getting different input in the future. If we want to fix this, we'll need to rewrite getAncestorsOf
              // a little and fix up where it's used to allow for not assuming it's going to give back only one answer.
              // It's still conflicting if we do that as usually getAncestorsOf itself and what needs it is complex, so less updates is better.

              if(i === 0){ // Only do this once
                let localSetOfLocationNames: string[] = [];
                for(let locIndex in locations){
                  this.searchService.getLocation(locations[locIndex]).subscribe(loc => {
                    localSetOfLocationNames.push(loc.name);
                      this.listeningToLocationNames = localSetOfLocationNames;
                  })
                }
              }

            })
              */
          })
          
          // Add to the notified section if it was for the person reading it
          if(reports[i].reportedTo && reports[i].reportedTo.indexOf(user.id) > -1){
            this.notifiedReports.push(reports[i]);
          }
          else {
            this.externalReports.push(reports[i]);
          }

          // Only sort the reports once after all is loaded
          if(i === reports.length - 1){
            this.notifiedReports.sort(function(a, b) {
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
            this.externalReports.sort(function(a, b) {
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

          // Get the name of the person that reported it
          this.authService.getUserInfo(reports[i].user).subscribe(z => {reports[i].userName = z.firstName + " " + z.lastName});
        }
      })
    });
  }

  ngAfterViewInit() {
    
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
