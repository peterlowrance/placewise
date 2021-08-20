import { CdkDragDrop, moveItemInArray } from '@angular/cdk/drag-drop';
import { Component, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { ActivatedRoute, Router } from '@angular/router';
import { HierarchyLocation } from 'src/app/models/Location';
import { ReportStructure } from 'src/app/models/ReportStructure';
import { User } from 'src/app/models/User';
import { UserInput } from 'src/app/models/UserInput';
import { WorkspaceUser } from 'src/app/models/WorkspaceUser';
import { AdminService } from 'src/app/services/admin.service';
import { ReportService } from 'src/app/services/report.service';
import { SearchService } from 'src/app/services/search.service';
import { AttributeBuilderDialogComponent } from '../attribute-builder-dialog/attribute-builder-dialog.component';
import { ColorPaletteDialogComponent } from '../color-palette-dialog/color-palette-dialog.component';
import { ModifyHierarchyDialogComponent } from '../modify-hierarchy-dialog/modify-hierarchy-dialog.component';
import { ReportFormatPieceDialogComponent } from '../report-format-piece-dialog/report-format-piece-dialog.component';
import { UserInputDialogComponent } from '../user-input-dialog/user-input-dialog.component';

@Component({
  selector: 'app-report-template-edit',
  templateUrl: './report-template-edit.component.html',
  styleUrls: ['./report-template-edit.component.css']
})
export class ReportTemplateEditComponent implements OnInit {

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private reportService: ReportService,
    private adminService: AdminService,
    public dialog: MatDialog,
    private searchService: SearchService
    ) { }

  type: string;
  template: ReportStructure;
  locationIDs: string[] = [];
  isUrgent: boolean;
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
          if(this.template){
            this.locationIDs = [];
            this.isUrgent = this.template.urgentReportSubject ? true : false;

            if(this.template.locations){
              for(let locationID in this.template.locations){
                this.locationIDs.push(locationID);
                this.searchService.getLocation(locationID).subscribe(loc => {
                  this.locationsLoadedMap[locationID] = loc;
                })
              }
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
        
        if(this.template.locations){
          this.template.locations[result[0]] = {users: []};
        }
        else {
          this.template.locations = {[result[0]]: {users: []}};
        }
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

  editUserInput(input : UserInput){
    this.dialog.open(UserInputDialogComponent, {width: '360px', 
      data: {
        name: input.name, 
        description: input.description,
        type: input.type
      }
    }).beforeClosed().subscribe(result => {

      if(result && result.wasValid){
        // Find the input we're editing and update it
        for(let index in this.template.userInput){
          if(this.template.userInput[index].name === input.name){

            // If we made changes to the name, update those references in the formatter
            if(result.data.name !== input.name){
              for(let index in this.template.reportTextFormat){
                if(this.template.reportTextFormat[index].type === 'input' && this.template.reportTextFormat[index].data === input.name){
                  this.template.reportTextFormat[index].data = result.data.name;
                }
              }
            }

            this.template.userInput[index] = result.data;
            this.save();
          }
        }
      }
    });
  }

  addUserInput(){
    this.dialog.open(UserInputDialogComponent, {width: '360px', 
      data: {
        name: "", 
        description: "",
        type: 'text'
      }
    }).beforeClosed().subscribe(result => {
      if(result && result.wasValid){
        // Find the input we're editing and update it
        this.template.userInput.push(result.data);
        this.save();
      }
    });
  }

  deleteUserInput(deleteInput: UserInput){
    if(confirm("Are you sure you want to delete this input? It will also be removed anywhere it is used in the Report Formatter.")){
      this.template.userInput = this.template.userInput.filter(input => deleteInput.name !== input.name);
      this.save();
    }
  }

  setIsUrgent(event){
    if(event.checked){
      this.template.urgentReportSubject = "Urgent Placebin Report";
      this.isUrgent = true;
    }
    else {
      delete this.template.urgentReportSubject;
      this.isUrgent = false;
    }

    this.save();
  }

  changeColor(){
    this.dialog.open(ColorPaletteDialogComponent, {width: '45rem'})
    .beforeClosed().subscribe(result => {
      if(result && result.wasValid){
        this.template.color = result.data;
        this.save();
      }
    });
  }

  drop(event: CdkDragDrop<string[]>){
    moveItemInArray(this.template.reportTextFormat, event.previousIndex, event.currentIndex);
    this.save();
  }

  deleteFormatPiece(index: number){
    this.template.reportTextFormat.splice(index, 1);
    this.save();
  }

  addFormatPiece(){
    this.dialog.open(ReportFormatPieceDialogComponent, {width: '45rem', data: {inputs: this.template.userInput}})
    .beforeClosed().subscribe(result => {
      if(result && result.wasValid){
        this.template.reportTextFormat.push(result.data);
        this.save();
      }
    });
  }

  save(){
    this.reportService.updateTemplate(this.template, this.type);
  }

  deleteTemplate(){
    if(confirm("Are you sure you want to delete this template? Reports that have used this template will stay, but you will no longer be able to use this report type.")){
      this.reportService.deleteTemplate(this.type).then(result => {
        if(result){
          this.router.navigate(['/reports/templates']);
        }
      });
    }
  }

}
