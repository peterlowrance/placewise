import { Attribute, Component, Inject, OnInit } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { CategoryAttribute } from 'src/app/models/Attribute';

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

  layerNames: string[];
  selectedLayer = '';

  ngOnInit(): void {
  }

  nextStep(){
    if(this.selected === 'text'){
      this.step = 'text';
    }
    else {
      this.step = "layer";
    }
  }

  loadLayers(){
    for(let attr of this.data.attributes){
      if(attr.name === this.selected){

        // Used for detecting if we should go next or end
        if(attr.layerNames){
          this.layerNames = attr.layerNames;
        }
        else {
          delete this.layerNames;
        }

        break;
      }
    }
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
        if(this.selectedLayer){
          data = {type: 'attribute layer', data: this.selected + "\n" + this.selectedLayer}
        }
        else {
          data = {type: 'attribute', data: this.selected}
        }
      }
    }

    this.dialogRef.close({wasValid: true, data});
  }

  cancel(){
    this.dialogRef.close({wasValid: false});
  }

}
