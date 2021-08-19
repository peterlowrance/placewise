import { Component, Inject, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialog, MatDialogRef } from '@angular/material/dialog';
import { UserInput } from 'src/app/models/UserInput';

@Component({
  selector: 'app-user-input-dialog',
  templateUrl: './user-input-dialog.component.html',
  styleUrls: ['./user-input-dialog.component.css']
})
export class UserInputDialogComponent implements OnInit {

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: UserInput,
    public dialog: MatDialog,
    public dialogRef: MatDialogRef<UserInputDialogComponent>
  ) { }

  step: string = 'type';

  ngOnInit(): void {

  }

  nextStep(){
    /*
    if(this.data.type === 'number'){
      this.step = 'numConditions';
      return;
    }
    */

    if(this.step === 'type'){
      this.step = 'name';
    }
    else {
      this.finish();
    }
  }

  isReadyForNextStep(){
    if(this.step === 'name'){
      if(!this.data.name || !this.data.description){
        return false;
      }
    }
    return true;
  }

  cancel(){
    this.dialogRef.close({wasValid: false});
  }

  finish(){
    this.dialogRef.close({wasValid: true, data: this.data});
  }

}
