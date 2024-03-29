import { stringify } from '@angular/compiler/src/util';
import { Component, Inject, OnInit } from '@angular/core';
import { MatDialog, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';

@Component({
  selector: 'app-simple-field-dialog',
  templateUrl: './simple-field-dialog.component.html',
  styleUrls: ['./simple-field-dialog.component.css']
})
export class SimpleFieldDialogComponent implements OnInit {

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: {fieldName: string, value: string, description?: string},
    public dialogRef: MatDialogRef<SimpleFieldDialogComponent>,
    public dialog: MatDialog
  ) {}

  newValue: string;

  ngOnInit() {
    this.newValue = this.data.value;
  }

  setValue(value){
    this.newValue = value;
  }

  submit(){
    this.dialogRef.close({value: this.newValue.replace('\n', ''), changed: this.newValue !== this.data.value, wasValid: true});
  }

  cancel(){
    this.dialogRef.close({wasValid: false});
  }

}
