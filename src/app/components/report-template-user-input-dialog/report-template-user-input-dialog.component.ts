import { Component, Inject, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';

@Component({
  selector: 'app-report-template-user-input-dialog',
  templateUrl: './report-template-user-input-dialog.component.html',
  styleUrls: ['./report-template-user-input-dialog.component.css']
})
export class ReportTemplateUserInputDialogComponent implements OnInit {

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: {name: string, description: string, type: string},
  ) { }

  ngOnInit(): void {
  }

}
