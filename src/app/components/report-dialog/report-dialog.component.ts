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
import { ItemReport } from 'src/app/models/ItemReport';
import { ItemTypeReportTimestamp } from 'src/app/models/ItemTypeReportTimestamp';

interface LocationWithReportMeta {
  location: HierarchyLocation, 
  canNotAutoReport?: boolean, 
  canReport: boolean
}

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

  loading = {
    custom: false,
    low: false,
    empty: false
  }

  locationData: LocationWithReportMeta[] = [];

  step: string;
  admins: WorkspaceUser[];
  selectedAdmins: WorkspaceUser[];
  description: string = '';
  type: string = 'custom';
  locationID = 'none';
  isAutoReport = false;

  reportLowDisabled = false;
  reportEmptyDisabled = false;
  canReport = true;

  reportsInLast12HPerLocation: Map<string, number>;

  ngOnInit() {
    this.step = 'start';
    let timestamp = Date.now();

    this.locationData = this.countRecentReports(this.data.locations, this.data.item.reports, timestamp);

    this.canReport = this.isAbleToReport(this.locationData);

    let autoData: {isLow: boolean, isEmpty: boolean} = this.isAbleToAutoReport(this.locationData, this.data.item.lastReportTimestampByType, timestamp);
    this.reportLowDisabled = autoData.isLow;
    this.reportEmptyDisabled = autoData.isEmpty;

    /*
    // For each report type, mark thier corresponding location as full if it's been reported in 12h
    if(this.data.item.lastReportTimestampByType){ 
      for(let autoTimestampSearch of this.data.item.lastReportTimestampByType){
        for(let location of this.data.locations){
          if(autoTimestampSearch.location === location.ID){

            // 12 hour check. If it's empty, also mark low reports as full
            if(autoTimestampSearch.timestamp + 43200000 > timestamp){
              if(autoTimestampSearch.type === 'Low'){
                location.lowReportFull = true;
                console.log("Low: " + location.ID);
              }
              else if(autoTimestampSearch.type === 'Empty'){
                location.emptyReportFull = true;
                location.lowReportFull = true;
                console.log("Empty: " + location.ID);
              }
            }

            // For some efficiency, once location is found we break this loop
            break;
          }
        };
      }
    }

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
    
    // Scan through reports to count total reports per location in last 12h
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
    */

    console.log(this.canReport);
    
  }

  // Based on the reports and thier timestamps, return data if certain reports can be made
  countRecentReports(locations: HierarchyLocation[], itemReports: ItemReport[], timestamp: number): LocationWithReportMeta[] {
    let locData: LocationWithReportMeta[] = [];
    
    // Fill in data for each report
    for(let location of locations){
      let locationCounter = 0;

      // Go through all live reports and count up the ones attached to the item's location
      // in the last 12h
      if(itemReports){
        for(let report of itemReports){
          if(report.location === location.ID && report.timestamp + 43200000 > timestamp){
            locationCounter++;
          }
          if(locationCounter >= 3){
            break;
          }
        }
      }
      
      // If there's more than three reports per location, mark it as disabled
      if(locationCounter >= 3){
        locData.push({location, canReport: false});
      }
      else {
        locData.push({location, canReport: true});
      }
    }

    return locData;
  }

  // Sees if the reports are completely full
  isAbleToReport(locationData: LocationWithReportMeta[]): boolean {
    let result = false;

    // Just look for the first instance of somewhere we can report
    for(let locationWithData of locationData){
      if(locationWithData.canReport){
        result = true;
        break;
      }
    }

    return result;
  }

  // This sees if we are able to create any report for this type of report
  isAbleToAutoReport(locationData: LocationWithReportMeta[], typeReportTimestmaps: ItemTypeReportTimestamp[], timestamp: number): { isLow: boolean, isEmpty: boolean }{
    let result = { isLow: false, isEmpty: false };

    for(let locationWithReportData of locationData){
      if(locationWithReportData.canReport && typeReportTimestmaps){
        for(let timestampData of typeReportTimestmaps){
          if(timestampData.location === locationWithReportData.location.ID && timestampData.timestamp + 43200000 > timestamp){
            if(timestampData.type === 'Low'){
              result.isLow = true;
            } else {
              result.isLow = true;
              result.isEmpty = true;
            }
          }
        }
      }
    }

    return result;
  }

  // Update location data to match what type of auto report we are looking for
  updateLocationDataForAutoReport(type: string, locationData: LocationWithReportMeta[], typeReportTimestmaps: ItemTypeReportTimestamp[], timestamp: number){
    for(let locationWithReportData of locationData){
      let found = false;

      for(let timestampData of typeReportTimestmaps){
        if(timestampData.location === locationWithReportData.location.ID && timestampData.type === type){
          // If the last report was over 12 hours ago, we're good
          if(timestampData.timestamp + 43200000 > timestamp){
            locationWithReportData.canNotAutoReport = true;
          }

          found = true;
          break;
        }
      }

      // If there is no data, there hasn't be a report ofr this so we're good
      if(!found){
        locationWithReportData.canNotAutoReport = true;
      }
    }
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

    // Add count of reports per location in the last 12h
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

    // Add the rest of the locations as 0 reports in last 12h
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
