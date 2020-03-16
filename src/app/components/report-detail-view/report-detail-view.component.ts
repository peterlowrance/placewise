import { Component, OnInit, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material';
import { HierarchyItem } from 'src/app/models/HierarchyItem';
import { DetailedReportModalData } from 'src/app/models/DetailedReportModalData';

@Component({
  selector: 'app-report-detail-view',
  templateUrl: './report-detail-view.component.html',
  styleUrls: ['./report-detail-view.component.css']
})
export class ReportDetailViewComponent implements OnInit {

  constructor(
    public dialogRef: MatDialogRef<ReportDetailViewComponent>,
    @Inject(MAT_DIALOG_DATA) public data: DetailedReportModalData
  ) { }

  onSendClick(){
    //set invalid report
    this.data.remove=true;
    this.dialogRef.close(this.data);
  }

  onCancelClick(){
    //set invalid report
    this.data.remove=false;
    this.dialogRef.close(this.data)
  }
  ngOnInit() {
  }

}
