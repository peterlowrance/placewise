import { Component, Inject, OnInit } from '@angular/core';
import { MatDialog, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { UserInput } from 'src/app/models/UserInput';

@Component({
  selector: 'app-report-format-piece-dialog',
  templateUrl: './report-format-piece-dialog.component.html',
  styleUrls: ['./report-format-piece-dialog.component.css']
})
export class ReportFormatPieceDialogComponent implements OnInit {

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: {inputs?: UserInput[]},
    public dialog: MatDialog,
    public dialogRef: MatDialogRef<ReportFormatPieceDialogComponent>
  ) { }

  type: string = 'text';
  step: string = 'type';
  setupData: string = '';

  ngOnInit(): void {
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

  nextStep(){
    this.step = this.type;
  }

  isReadyForNextStep(){
    if(this.step !== 'type' && !this.setupData){
      return false;
    }
    return true;
  }

  cancel(){
    this.dialogRef.close({wasValid: false});
  }

  finish(){
    this.dialogRef.close({wasValid: true, data: {type: this.type, data: this.setupData}});
  }

}
