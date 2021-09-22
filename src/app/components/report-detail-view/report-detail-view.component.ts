import { Component, OnInit, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { HierarchyItem } from 'src/app/models/HierarchyItem';
import { DetailedReportModalData } from 'src/app/models/DetailedReportModalData';
import { ActivatedRoute, Router } from '@angular/router';

@Component({
  selector: 'app-report-detail-view',
  templateUrl: './report-detail-view.component.html',
  styleUrls: ['./report-detail-view.component.css']
})
export class ReportDetailViewComponent implements OnInit {

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    public dialogRef: MatDialogRef<ReportDetailViewComponent>,
    @Inject(MAT_DIALOG_DATA) public data: {workspaceID: string, reportData: DetailedReportModalData}
  ) { }

  location: string;

  onSendClick(){
    //set invalid report
    this.data.reportData.toBeRemoved=true;
    this.dialogRef.close(this.data);
  }

  onCancelClick(){
    //set invalid report
    this.data.reportData.toBeRemoved=false;
    this.dialogRef.close(this.data);
  }

  goToItem() {
    this.router.navigate(['/w/' + this.data.workspaceID + '/item/', this.data.reportData.itemID]);
    this.dialogRef.close(this.data);
  }

  ngOnInit() {
  }

}
