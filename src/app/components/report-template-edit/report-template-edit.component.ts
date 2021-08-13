import { Component, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { ActivatedRoute } from '@angular/router';
import { HierarchyLocation } from 'src/app/models/Location';
import { ReportStructure } from 'src/app/models/ReportStructure';
import { User } from 'src/app/models/User';
import { WorkspaceUser } from 'src/app/models/WorkspaceUser';
import { AdminService } from 'src/app/services/admin.service';
import { ReportService } from 'src/app/services/report.service';
import { SearchService } from 'src/app/services/search.service';
import { ModifyHierarchyDialogComponent } from '../modify-hierarchy-dialog/modify-hierarchy-dialog.component';
import { ReportTemplateUserInputDialogComponent } from '../report-template-user-input-dialog/report-template-user-input-dialog.component';

@Component({
  selector: 'app-report-template-edit',
  templateUrl: './report-template-edit.component.html',
  styleUrls: ['./report-template-edit.component.css']
})
export class ReportTemplateEditComponent implements OnInit {

  constructor(
    private route: ActivatedRoute,
    private reportService: ReportService,
    private adminService: AdminService,
    public dialog: MatDialog,
    private searchService: SearchService
    ) { }

  type: string;
  template: ReportStructure;
  locationIDs: string[] = [];

  usersLoaded: WorkspaceUser[];

  locationsLoadedMap: {
    [ID: string] : HierarchyLocation;
  } = {};
  usersLoadedMap: {
    [ID: string] : WorkspaceUser;
  } = {};

  ngOnInit(): void {
    this.type = this.route.snapshot.paramMap.get('type');

    this.adminService.getWorkspaceUsers().subscribe(users => {
      for(let user of users){
        this.usersLoadedMap[user.id] = user;
      }

      this.usersLoaded = users;

      this.reportService.getReportTemplates().subscribe(templates => {
        if(templates){
          this.template = templates[this.type];
          this.locationIDs = [];

          if(this.template.locations){
            for(let locationID in this.template.locations){
              this.locationIDs.push(locationID);
              this.searchService.getLocation(locationID).subscribe(loc => {
                this.locationsLoadedMap[locationID] = loc;
              })
            }
          }
        }
      });
    })
  }

  getWorkspaceUsers(IDs: string[]): WorkspaceUser[] {
    if(!IDs){
      return [];
    }
    return IDs.map(ID => this.usersLoadedMap[ID]);
  }

  getFormatColor(type: string): string {
    if(type === 'number'){
      return '#3050D8';
    }
    if(type === 'text'){
      return '#9c4dcc';
    }
    if(type === 'date'){
      return '#00695c';
    }
    if(type === 'user'){
      return '#bf360c';
    }
    if(type === 'selection'){
      return '#e65100';
    }
    if(type === 'image'){
      return '#d39400';
    }
    else return '#000000';
  }

  getFormatColorFromInputName(name: string): string {
    for(let input of this.template.userInput){
      if(input.name === name){
        return this.getFormatColor(input.type);
      }
    }

    return '#FF0000';
  }

  addLocation(){
    const dialogRef = this.dialog.open(ModifyHierarchyDialogComponent, {
      width: '45rem',
      data: {hierarchy: 'locations', singleSelection: true, id: '', parents: ['root']}
    });
    dialogRef.afterClosed().subscribe(result => {
      if(result && result[0]){
        // First make sure this isn't already a location. If it is, we'll just do nothing.
        for(let locationID in this.template.locations){
          if(result[0] === locationID){
            return;
          }
        }
        
        this.template.locations[result[0]] = {users: []};
        this.save();
      }
    })
  }

  removeLocation(locationID: string){
    if(this.template.locations[locationID]){
      delete this.template.locations[locationID];
      this.save();
    }
  }

  updateReportedToUsers(event: WorkspaceUser[]){
    this.template.reportToUsers = event.map(user => user.id);
    this.save();
  }

  updateLocationUsers(event: WorkspaceUser[], locationID: string){
    this.template.locations[locationID].users = event.map(user => user.id);
    this.save();
  }

  editUserInput(input : {name: string, description: string, type: string}){
    /*
    const dialogRef = this.dialog.open(ReportTemplateUserInputDialogComponent, {
      width: '45rem',
      data: {hierarchy: 'locations', singleSelection: true, id: '', parents: ['root']}
    });
    dialogRef.afterClosed().subscribe(result => {
      if(result && result[0]){
        // First make sure this isn't already a location. If it is, we'll just do nothing.
        for(let locationID in this.template.locations){
          if(result[0] === locationID){
            return;
          }
        }
        
        this.template.locations[result[0]] = {users: []};
        this.save();
      }
    })
    */
  }

  save(){
    this.reportService.updateTemplate(this.template, this.type);
  }

}
