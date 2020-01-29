import { Component, OnInit, Inject } from '@angular/core';
import {MatDialogRef, MAT_DIALOG_DATA} from '@angular/material/dialog';
import {ItemReportModalData} from 'src/app/models/ItemReportModalData'

//placeholder error description
const PLACEHOLDER: string = 'Something is wrong with this item.\nPlease follow-up.';

@Component({
  selector: 'app-report-dialog',
  templateUrl: './report-dialog.component.html',
  styleUrls: ['./report-dialog.component.css']
})
export class ReportDialogComponent implements OnInit {

  constructor(
    public dialogRef: MatDialogRef<ReportDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: ItemReportModalData
  ) { }

  ngOnInit() {
  }

  onSendClick(){
    //set invalid report
    this.data.valid=true;
    if(this.data.desc == '') this.data.desc = PLACEHOLDER;
    this.dialogRef.close(this.data);
  }

  onCancelClick(){
    //set invalid report
    this.data.valid=false;
    this.dialogRef.close(this.data)
  }

}
