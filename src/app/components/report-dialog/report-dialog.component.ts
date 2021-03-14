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
  location?: HierarchyLocation, 
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
  timestamp = Date.now();

  reportsInLast12HPerLocation: Map<string, number>;

  ngOnInit() {
    this.step = 'start';

    this.locationData = this.countRecentReports(this.data.locations, this.data.item.reports, this.timestamp);

    this.canReport = this.isAbleToReport(this.locationData);

    this.reportEmptyDisabled = !this.isAbleToAutoReportFor("Empty", this.locationData, this.data.item.lastReportTimestampByType, this.timestamp);
    
    // If it's empty, then it's low
    if(this.reportEmptyDisabled) {
      this.reportLowDisabled = true;
    }
    else {
      this.reportLowDisabled = !this.isAbleToAutoReportFor("Low", this.locationData, this.data.item.lastReportTimestampByType, this.timestamp);
    }

    console.log(this.canReport);
    
  }

  // Based on the reports and thier timestamps, return data if certain reports can be made
  countRecentReports(locations: HierarchyLocation[], itemReports: ItemReport[], timestamp: number): LocationWithReportMeta[] {
    let locData: LocationWithReportMeta[] = [];
    
    // If the item has location, fill in data for each location
    if(locations && locations.length > 0){
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
    }
    // If this item does not have a location, look for reports with the 'none' location
    else {
      let noneLocationReports = 0;

      if(itemReports){
        for(let report of itemReports){
          if(report.location === 'none' && report.timestamp + 43200000 > timestamp){
            noneLocationReports++;
          }
          if(noneLocationReports >= 3){
            break;
          }
        }
      }

      if(noneLocationReports >= 3){
        locData.push({canReport: false});
      }
      else {
        locData.push({canReport: true});
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
  isAbleToAutoReportFor(type: string, locationData: LocationWithReportMeta[], typeReportTimestmaps: ItemTypeReportTimestamp[], timestamp: number): boolean {
    // If there is no time stamps, immediately return good
    if(!typeReportTimestmaps){
      return true;
    }

    // NEXT: This is not working right for full locations

    // Go through each location to see if there's an open spot for this type of auto report
    for(let locationWithReportData of locationData){
      // If we can't report for this location, then go to the next location
      if(locationWithReportData.canReport){
        let found = false;
        let noLocation = locationWithReportData.location ? false : true;

        for(let timestampData of typeReportTimestmaps){
          if(noLocation){
            if(timestampData.location === 'none' && timestampData.type === type){
              // If this report timestamp is old, return good
              if(timestampData.timestamp + 43200000 < timestamp){
                return true;
              }
              found = true;
            }
          }
          else {
            if(timestampData.location === locationWithReportData.location.ID && timestampData.type === type){
              // If this report timestamp is old, return good
              if(timestampData.timestamp + 43200000 < timestamp){
                return true;
              }
              found = true;
            }
          }
        }

        // If there's no previous data for a location, then we're good to report here
        if(!found){
          return true;
        }
      }
    }

    // If no open slots were found, return bad
    return false;
  }

  // Update location data to match what type of auto report we are looking for
  updateLocationDataForAutoReport(type: string, locationData: LocationWithReportMeta[], typeReportTimestmaps: ItemTypeReportTimestamp[], timestamp: number){
    for(let locationWithReportData of locationData){
      if(typeReportTimestmaps)
      for(let timestampData of typeReportTimestmaps){
        if(timestampData.location === locationWithReportData.location.ID && timestampData.type === type){
          // If the last report was less than 12 hours ago, disable this location
          if(timestampData.timestamp + 43200000 > timestamp){
            locationWithReportData.canNotAutoReport = true;
          }

          // Since this is the correct location and type, we can break the loop and look at next location
          break;
        }
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
      this.updateLocationDataForAutoReport("Low", this.locationData, this.data.item.lastReportTimestampByType, this.timestamp);
    }
    else {
      this.description = "Item is empty!"
      this.type = "Empty"
      this.loading.empty = true;
      this.updateLocationDataForAutoReport("Empty", this.locationData, this.data.item.lastReportTimestampByType, this.timestamp);
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
