import { Component, OnInit, Inject } from '@angular/core';
import {MatDialogRef, MAT_DIALOG_DATA} from '@angular/material/dialog';
import {ItemReportModalData} from 'src/app/models/ItemReportModalData'
import { Item } from 'src/app/models/Item';
import { Router } from '@angular/router';
import { unwatchFile } from 'fs';
import { WorkspaceUser } from 'src/app/models/WorkspaceUser';
import { AdminService } from 'src/app/services/admin.service';
import { AuthService } from 'src/app/services/auth.service';
import {MatSnackBar} from '@angular/material';
import { HierarchyLocation } from 'src/app/models/Location';
import { ItemBuilderComponent } from '../item-builder/item-builder.component';

//placeholder error description
const PLACEHOLDER: string = 'Something is wrong with this item.\nPlease follow-up.';

@Component({
  selector: 'app-report-dialog',
  templateUrl: './report-dialog.component.html',
  styleUrls: ['./report-dialog.component.css']
})
export class ReportDialogComponent implements OnInit {

  constructor(private router: Router,
    public dialogRef: MatDialogRef<ReportDialogComponent>,
    private adminService: AdminService,
    private authService: AuthService,
    private snack: MatSnackBar,
    @Inject(MAT_DIALOG_DATA) public data: {item: Item, locations: HierarchyLocation[]}
  ) { }

  step: string;
  loading = {
    custom: false,
    low: false,
    empty: false
  }
  admins: WorkspaceUser[];
  selectedAdmins: WorkspaceUser[];
  description: string = '';
  type: string = 'custom';
  locationID = 'none';
  isAutoReport = false;

  reportLowDisabled = false;
  reportEmptyDisabled = false;
  reportCustomDisabled = false;

  reportsInLast12HPerLocation: Map<string, number>;
  canReport = true;

  ngOnInit() {
    this.step = 'start';
    let timestamp = Date.now();

    // Disable auto report button if it's been less than a day since last report
    if(this.data.item.lastReportTimestampByType)
    for(let autoTimestampSearch of this.data.item.lastReportTimestampByType){
      if(autoTimestampSearch.timestamp + 43200000 > timestamp){
        if(autoTimestampSearch.type === 'Low'){
          this.reportLowDisabled = true;
        }
        else if(autoTimestampSearch.type === 'Empty'){
          this.reportEmptyDisabled = true;
          this.reportLowDisabled = true;
        }
      }
    };
    
    // Scan through reports to count total reports per location in last 24h
    this.reportsInLast12HPerLocation = this.countReportsInLastDay(this.data.item.locations, timestamp, this.data.item.reports);

    // If there are no locations, see if 'none' location has too many reports
    if(!this.data.item.locations || this.data.item.locations.length < 1){
      if(this.reportsInLast12HPerLocation.get('none') > 2){
        this.canReport = false;
      }
    }
    // If there's one, look at that location for if there's too many reports
    else if (this.data.item.locations.length < 2) {
      if(this.reportsInLast12HPerLocation.get(this.data.item.locations[0]) > 2){
        this.canReport = false;
      }
    }
    // Otherwise, check each one. If any are not full, we can still do a custom report.
    else {
      let allFull = true;
      for(let location of this.data.item.locations){
        console.log(this.reportsInLast12HPerLocation.get(location));
        if(this.reportsInLast12HPerLocation.get(location) < 3){
          allFull = false;
          break;
        }
      }

      if(allFull) {
        this.canReport = false;
      }
    }

    console.log(this.canReport);
    
  }

  onNextClick() {
    if(this.step === 'start'){
      this.loading.custom = true;
      this.adminService.getWorkspaceUsers().subscribe(users => {
        if(users && users.length === this.authService.usersInWorkspace){
          this.loading.custom = false;

          // Load admins for selection
          this.admins = users.filter(element => { return element.role === "Admin" });
          // Load selected people to report to
          this.selectedAdmins = this.admins.filter(element => { return this.authService.workspace.defaultUsersForReports.indexOf(element.id) > -1 });
          
          // If there's no location, keep the locationID to 'none' and skip a step
          if(!this.data.locations || this.data.locations.length < 1){
            this.step = 'who';
          }
          // If there's one location, update the report locationID and skip a step
          else if(this.data.locations.length === 1){
            this.locationID = this.data.locations[0].ID;
            this.step = 'who';
          }
          // Otherwise go to selecting which location to report about
          else {
            this.step = 'where';
          }
        }
      });
    }
    else if(this.step === 'who') {
      this.step = 'text';
    }
  }

  setLocation(locationID: string){
    this.locationID = locationID;

    if(this.isAutoReport){
      this.sendReport();
    }
    else {
      this.step = 'who';
    }
  }

  countReportsInLastDay(locations: string[], timestamp: number, reports: [{location: string, report: string, timestamp: number}]): Map<string, number> {
    let reportPerLocationCount: Map<string, number> = new Map();
    let count: number; // For effciency

    console.log(reportPerLocationCount);

    // Add count of reports per location in the last 24h
    for(let report of reports){
      if(report.timestamp + 43200000 > timestamp){
        count = reportPerLocationCount.get(report.location);
        if(count){
          reportPerLocationCount.set(report.location, count + 1);
        }
        else {
          reportPerLocationCount.set(report.location, 1);
        }
      }
    }

    // Add the rest of the locations as 0 reports in last 24h
    for(let location of locations){
      if(!reportPerLocationCount.has(location)){
        reportPerLocationCount.set(location, 0);
      }
    }

    // Add empty general reports if none exist
    if(!reportPerLocationCount.has('none')){
      reportPerLocationCount.set('none', 0);
    }

    return reportPerLocationCount;
  }

  onSendClick(){
    if(this.description == '') this.description = PLACEHOLDER;
    this.sendReport();
  }

  onCancelClick(){
    this.dialogRef.close({wasValid: false});
  }

  setupAutoReport(message: string){

    if(message === "low"){
      this.description = "Item is low."
      this.type = "Low";
      this.loading.low = true;
    }
    else {
      this.description = "Item is empty!"
      this.type = "Empty"
      this.loading.empty = true;
    }

    this.adminService.getWorkspaceUsers().subscribe(users => {
      if(users && users.length === this.authService.usersInWorkspace){
         
        // Load admins for selection
        this.admins = users.filter(element => { return element.role === "Admin" });
        // Load selected people to report to
        this.selectedAdmins = this.admins.filter(element => { return this.authService.workspace.defaultUsersForReports.indexOf(element.id) > -1 });

        // If there's no location or only one, set that up quick and report immediately
        if(!this.data.locations || this.data.locations.length < 2){
          if(this.data.locations.length === 1){
            this.locationID = this.data.locations[0].ID;
          }
          this.sendReport();
        }
        
        // Otherwise specify which location
        else {
          this.isAutoReport = true;
          this.step = 'where';
        }
      }
    })
  }

  sendReport(){
    this.dialogRef.close({wasValid: true});
    this.snack.open("Sending Report...", '', {duration: 2000, panelClass: ['mat-toolbar']});

    this.adminService.placeReport(this.data.item.ID, this.description, this.selectedAdmins.map(user => user.id), this.locationID, this.type).then(
      () => this.snack.open("Report Sent!", "OK", {duration: 4000, panelClass: ['mat-toolbar']}),
      (err) => {
        this.snack.open("Report Failed. " + err.status, "OK", {duration: 10000, panelClass: ['mat-toolbar']})
        console.log(JSON.stringify(err));
      }
    );
  }

}
