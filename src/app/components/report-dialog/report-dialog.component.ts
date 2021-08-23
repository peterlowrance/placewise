import { Component, OnInit, Inject } from '@angular/core';
import {MatDialogRef, MAT_DIALOG_DATA} from '@angular/material/dialog';
import {ItemReportModalData} from 'src/app/models/ItemReportModalData'
import { Item } from 'src/app/models/Item';
import { ActivatedRoute, Router } from '@angular/router';
import { unwatchFile } from 'fs';
import { WorkspaceUser } from 'src/app/models/WorkspaceUser';
import { AdminService } from 'src/app/services/admin.service';
import { AuthService } from 'src/app/services/auth.service';
import {MatSnackBar} from '@angular/material/snack-bar';
import { HierarchyLocation } from 'src/app/models/Location';
import { ItemReport } from 'src/app/models/ItemReport';
import { ItemTypeReportTimestamp } from 'src/app/models/ItemTypeReportTimestamp';
import { ReportService } from 'src/app/services/report.service';
import { ReportStructure, ReportStructureWrapper } from 'src/app/models/ReportStructure';
import { identifierModuleUrl } from '@angular/compiler';
import { UserInput } from 'src/app/models/UserInput';
import { SearchService } from 'src/app/services/search.service';

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
    private route: ActivatedRoute, 
    public dialogRef: MatDialogRef<ReportDialogComponent>,
    private adminService: AdminService,
    private searchService: SearchService,
    private authService: AuthService,
    private reportService: ReportService,
    private snack: MatSnackBar,
    @Inject(MAT_DIALOG_DATA) public data: {workspaceID: string, item: Item, locations: HierarchyLocation[]}
  ) { }

  loading = {
    custom: false,
    low: false,
    //empty: false
  }

  workspaceID: string;
  locationData: LocationWithReportMeta[] = [];
  reportTypes: ReportStructureWrapper[];

  step: string;
  admins: WorkspaceUser[];
  selectedAdmins: WorkspaceUser[];
  description: string = '';
  type: string = 'custom';
  locationID = 'none';
  isTemplateReport = false;

  //reportEmptyDisabled = false;
  canReport = true;
  timestamp = Date.now();
  lowAmount;

  reportTemplate: ReportStructure;
  inputIndex: number = 0;
  input: UserInput;
  userInput: {[name: string]: any} = {};
  userFormFieldInput: any;

  reportsInLast12HPerLocation: Map<string, number>;

  ngOnInit() {
    this.step = 'start';
    this.workspaceID = this.data.workspaceID;

    this.locationData = this.countRecentReports(this.data.locations, this.data.item.reports, this.timestamp);
    this.canReport = this.isAbleToReport(this.locationData);

    console.log(this.data.item);
    this.reportService.getReportsAvailableHere(this.workspaceID, this.data.item).then(result => {
      this.reportTypes = result;

      /*
      let found = false;
      
      for(let report of result){
        if(report.abbreviation === 'Low'){
          found = true;

          // if(report.reportStructure.) We'll get specific reports in a moment
        }
      }

      if(!found){
        this.reportLowUnavailable = true;
      }
      */
    })
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

  // Update location data to match what type of auto report we are looking for
  updateLocationDataForAutoReport(type: string, locationData: LocationWithReportMeta[], typeReportTimestmaps: ItemTypeReportTimestamp[], timestamp: number){
    
    // If there's no timestamps, nothing is affected
    if(!typeReportTimestmaps){
      return;
    }

    for(let locationWithReportData of locationData){
      // If there's a location, look for matching reports 
      if(locationWithReportData.location){
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
      // If there's no location, look for matching reports with 'none' location
      else {
        for(let timestampData of typeReportTimestmaps){
          if(timestampData.location === 'none' && timestampData.type === type){
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
  }

  onNextClick() {
    if(this.step === 'start'){
      this.loading.custom = true;
      this.adminService.getWorkspaceUsers(this.workspaceID).subscribe(users => {
        if(users && users.length === this.authService.usersInWorkspace){
          this.loading.custom = false;

          this.searchService.getWorkspaceInfo(this.workspaceID).subscribe(workspaceInfo => {
            // Load admins for selection
          this.admins = users.filter(element => { return element.role === "Admin" });
          // Load selected people to report to
          this.selectedAdmins = this.admins.filter(element => { return workspaceInfo.defaultUsersForReports.indexOf(element.id) > -1 });
          
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
          });
        }
      });
    }
    else if(this.step === 'who') {
      this.step = 'text';
    }
  }

  setLocation(locationID: string){
    this.locationID = locationID;

    if(this.isTemplateReport){
      this.step = 'template';
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

  setupReport(type: string){
    if(type !== 'custom'){
      this.setupTemplateReport(type);
    } else {
      this.onNextClick();
    }
  }

  // Initial setup when the low button is pressed. Brings up location selection if need be.
  setupTemplateReport(type: string){
    this.type = type;
    this.loading.low = true;
    this.isTemplateReport = true;

    this.updateLocationDataForAutoReport(type, this.locationData, this.data.item.lastReportTimestampByType, this.timestamp);

    this.reportService.getReportTemplates(this.workspaceID).subscribe(templates => {
      this.reportTemplate = templates[type];
      this.input = this.reportTemplate.userInput[0];

      if(!this.data.locations || this.data.locations.length < 2){
        if(this.data.locations.length === 1){
          this.locationID = this.data.locations[0].ID;
        }
        this.step = 'template';
      }
      else {
        this.step = 'where';
      }
    })
  }

  logInputData(){
    this.userInput[this.reportTemplate.userInput[this.inputIndex].name] = this.userFormFieldInput;
  }

  nextInput(){
    this.logInputData();
    this.userFormFieldInput = "";
    
    this.inputIndex += 1;
    this.input = this.reportTemplate.userInput[this.inputIndex];
  }

  // Save inputed number from UI each stroke
  updateReportNumber(event){
    this.lowAmount = event.target.value;
  }

  sendTemplateReport(){
    this.logInputData(); // To get the last bit of input

    let reportText = "";
    for(let format of this.reportTemplate.reportTextFormat){
      if(format.type === 'input'){
        reportText += this.userInput[format.data];
      }
      else {
        reportText += format.data;
      }

      reportText += " ";
    }
    this.description = reportText;

    this.adminService.getWorkspaceUsers(this.workspaceID).subscribe(users => {
      if(users && users.length === this.authService.usersInWorkspace){
        // Load admins for selection
        this.admins = users.filter(element => { return element.role === "Admin" });
        
        // Load selected people to report to
        for(let reportStruct of this.reportTypes){
          if(this.type === reportStruct.type){
            this.selectedAdmins = this.admins.filter(admin => 
              reportStruct.reportStructure.reportToUsers.indexOf(admin.id) > -1
            );
          }
        }

        console.log(this.selectedAdmins);

        this.sendReport();
      }
    })
  }

  /*
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
  */

  sendReport(){
    // Append which location it was from
    for(let location of this.data.locations){
      if(location.ID === this.locationID){
        if(this.data.item.locationMetadata && 
          this.data.item.locationMetadata[this.locationID] &&
          this.data.item.locationMetadata[this.locationID].binID)
          {
          this.description += " - Located in bin " + this.data.item.locationMetadata[this.locationID].binID + " of " + location.name + ".";
        }
        else {
          this.description += " - Located in " + location.name + ".";
        }
        break;
      }
    }

    this.dialogRef.close({wasValid: true});
    this.snack.open("Sending Report...", '', {duration: 3000, panelClass: ['mat-toolbar']});

    this.reportService.placeReport(this.data.item.ID, this.description, this.selectedAdmins.map(user => user.id), this.locationID, this.type, this.reportTemplate.urgentReportSubject).then(
      () => this.snack.open("Report Sent!", "OK", {duration: 5000, panelClass: ['successful-report']}),
      (err) => {
        this.snack.open("Report Failed. " + err.status, "OK", {duration: 10000, panelClass: ['mat-toolbar']})
        console.log(JSON.stringify(err));
      }
    );
  }

}
