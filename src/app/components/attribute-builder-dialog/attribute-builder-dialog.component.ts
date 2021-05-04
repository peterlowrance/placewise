import { Component, OnInit } from '@angular/core';
import { MatDialogRef } from '@angular/material/dialog';
import { CategoryAttribute } from 'src/app/models/Attributes/CategoryAttribute';

@Component({
  selector: 'app-attribute-builder-dialog',
  templateUrl: './attribute-builder-dialog.component.html',
  styleUrls: ['./attribute-builder-dialog.component.css']
})
export class AttributeBuilderDialogComponent implements OnInit {

  constructor(
    public dialogRef: MatDialogRef<AttributeBuilderDialogComponent>,
    ) { }

  type: string = 'text';
  step: string = 'type';
  name: string = '';
  finishStep = false;

  ngOnInit(): void {
  }

  cannotGoNext(): boolean {
    if(this.step === 'name'){
      if(!this.name){
        return true;
      }
    }

    return false;
  }

  nextStep(){
    if(this.step === 'type'){
      this.step = 'name';
      if(this.type === 'text'){
        this.finishStep = true;
      }
    }

    else if(this.step === 'name'){
      this.step = '';
    }
  }

  finish(){
    let data: CategoryAttribute = {
      name: this.name,
      type: this.type
    }
    this.dialogRef.close({wasValid: true, data});
  }

  cancel(){
    this.dialogRef.close({wasValid: false});
  }

}
