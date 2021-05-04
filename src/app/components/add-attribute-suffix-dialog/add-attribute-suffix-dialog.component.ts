import { Attribute, Component, Inject, OnInit } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { CategoryAttribute } from 'src/app/models/Attributes/CategoryAttribute';

@Component({
  selector: 'app-add-attribute-suffix-dialog',
  templateUrl: './add-attribute-suffix-dialog.component.html',
  styleUrls: ['./add-attribute-suffix-dialog.component.css']
})
export class AddAttributeSuffixDialogComponent implements OnInit {

  constructor(
    public dialogRef: MatDialogRef<AddAttributeSuffixDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: {attributes: CategoryAttribute[], usedAttributes: string[]}
  ) { }

  selected = '';
  text = '';
  step = 'select';

  ngOnInit(): void {
  }

  nextStep(){
    this.step = 'text';
  }

  add(){
    let data;
    
    switch(this.selected){
      case 'space':
      case 'parent': {
        data = {type: this.selected};
        break;
      }
      case 'text': {
        data = {type: 'text', data: this.text.trim()};
        break;
      }
      default: {
        data = {type: 'attribute', data: this.selected}
      }
    }

    this.dialogRef.close({wasValid: true, data});
  }

  cancel(){
    this.dialogRef.close({wasValid: false});
  }

}
