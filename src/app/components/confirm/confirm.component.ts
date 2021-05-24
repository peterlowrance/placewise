import { Component, OnInit, Inject } from '@angular/core';
import { Router } from '@angular/router';
import { ReportDetailViewComponent } from '../report-detail-view/report-detail-view.component';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { ConfirmData } from 'src/app/models/ConfirmData';

@Component({
  selector: 'app-confirm',
  templateUrl: './confirm.component.html',
  styleUrls: ['./confirm.component.css']
})
export class ConfirmComponent implements OnInit {

  constructor(private router: Router,
    public dialogRef: MatDialogRef<ReportDetailViewComponent>,
    @Inject(MAT_DIALOG_DATA) public data: ConfirmData
  ) { }

  onSendClick(){
    //set invalid report
    this.data.confirm=true;
    this.dialogRef.close(this.data);
  }

  onCancelClick(){
    //set invalid report
    this.data.confirm=false;
    this.dialogRef.close(this.data)
  }

  ngOnInit() {
  }

}
