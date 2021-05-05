import { Component, OnInit } from '@angular/core';
import { MatDialogRef } from '@angular/material/dialog';
import { CategoryAttribute } from 'src/app/models/Attribute';

@Component({
  selector: 'app-attribute-builder-dialog',
  templateUrl: './attribute-builder-dialog.component.html',
  styleUrls: ['./attribute-builder-dialog.component.css']
})
export class AttributeBuilderDialogComponent implements OnInit {

  constructor(
    public dialogRef: MatDialogRef<AttributeBuilderDialogComponent>,
    ) { }

  attribute: CategoryAttribute = {
    name: ''
  }
  step: string = 'type';
  type: string = ''; // This is for saving space
  finishStep = false;


  ngOnInit(): void {
  }

  cannotGoNext(): boolean {
    if(this.step === 'name'){
      if(!this.attribute.name){
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
      else {
        this.attribute.options = [{value: "aaa"}];
      }
    }

    else if(this.step === 'name'){
      this.step = 'options';
    }
  }

  finish(){
    if(this.type !== 'text'){ // If it's custom text, don't bother taking up space with saying that.
      this.attribute.type = this.type;
    }
    console.log(this.attribute);
    //this.dialogRef.close({wasValid: true, data: this.attribute});
  }

  cancel(){
    this.dialogRef.close({wasValid: false});
  }

}
