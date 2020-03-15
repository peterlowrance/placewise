import { Component, OnInit, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material';
import { HierarchyItem } from 'src/app/models/HierarchyItem';

@Component({
  selector: 'app-report-detail-view',
  templateUrl: './report-detail-view.component.html',
  styleUrls: ['./report-detail-view.component.css']
})
export class ReportDetailViewComponent implements OnInit {

  constructor(
    public dialogRef: MatDialogRef<ReportDetailViewComponent>,
    @Inject(MAT_DIALOG_DATA) public data: HierarchyItem
  ) { }
  
  ngOnInit() {
  }

}
