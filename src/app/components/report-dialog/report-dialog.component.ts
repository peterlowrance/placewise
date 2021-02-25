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
  loadingUsers = false;
  admins: WorkspaceUser[];
  selectedAdmins: WorkspaceUser[];
  description: string = '';
  locationID = 'none';

  ngOnInit() {
    this.step = 'start';
  }

  onNextClick() {
    if(this.step === 'start'){
      this.loadingUsers = true;
      this.adminService.getWorkspaceUsers().subscribe(users => {
        if(users && users.length === this.authService.usersInWorkspace){
          this.loadingUsers = false;

          // Load admins for selection
          this.admins = users.filter(element => { return element.role === "Admin" });
          // Load selected people to report to
          this.selectedAdmins = this.admins.filter(element => { return this.authService.workspace.defaultUsersForReports.indexOf(element.id) > -1 });
          
          // If there's no location, keep the locationID to 'none' and skip to who
          if(!this.data.locations || this.data.locations.length < 1){
            this.step = 'who';
          }
          // If there's one location, update the report locationID and skip a step
          if(this.data.locations.length === 1){
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
    this.step = 'who';
  }

  onSendClick(){
    if(this.description == '') this.description = PLACEHOLDER;
    this.sendReport();
    this.dialogRef.close({wasValid: true});
  }

  onCancelClick(){
    this.dialogRef.close({wasValid: false});
  }

  sendReport(){
    this.adminService.placeReport(this.data.item.ID, this.description, this.selectedAdmins.map(user => user.id), this.locationID).then(
      () => this.snack.open("Report Sent", "OK", {duration: 3000, panelClass: ['mat-toolbar']}),
      (err) => {
        this.snack.open("Report Failed, " + err.status, "OK", {duration: 10000, panelClass: ['mat-toolbar']})
        console.log(JSON.stringify(err));
      }
    );
  }

}
