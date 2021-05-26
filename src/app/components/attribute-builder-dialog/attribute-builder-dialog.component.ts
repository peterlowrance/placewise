import { Component, Inject, OnInit } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { AttributeOption, CategoryAttribute } from 'src/app/models/Attribute';

@Component({
  selector: 'app-attribute-builder-dialog',
  templateUrl: './attribute-builder-dialog.component.html',
  styleUrls: ['./attribute-builder-dialog.component.css']
})
export class AttributeBuilderDialogComponent implements OnInit {

  constructor(
    public dialogRef: MatDialogRef<AttributeBuilderDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: {attribute: CategoryAttribute, step?: string, finishStep?: boolean}
    ) { }

  name: string = ''; // For category attribute, not layer
  step: string = 'type';
  type: string = ''; // This is for saving space
  finishStep = false;


  selectedValueForLayer = '';
  layerName: string = '';
  layerNames: string[] = [];
  layerNumber: number = 0;
  layers: {previousValue?: string, options: AttributeOption[]}[] = []; // Keeps track of where we're at

  ngOnInit(): void {
    if(this.data){
      if(this.data.finishStep){
        this.finishStep = this.data.finishStep;
      }

      if(this.data.attribute){
        let att = this.data.attribute;
        if(att.type === 'options'){
          this.name = att.name;
          this.type = att.type;
          if(att.layerNames) this.layerNames = att.layerNames;
          if(att.options){
            this.layers = [{options: att.options}];
          }
          else {
            this.layers = [{ options: []}];
          }
        }
      }

      if(this.data.step){
        this.step = this.data.step;
      }
    }
  }

  cannotGoNext(): boolean {
    if(this.step === 'name'){
      if(!this.name){
        return true;
      }
    }

    return false;
  }

  getConditionText(){
    if(this.layerNumber > 0){
      return "When " + this.layerNames[this.layerNumber - 1] + " is " + this.layers[this.layerNumber].previousValue; 
    }

    return '';
  }

  nextStep(){
    if(this.step === 'type'){
      this.step = 'name';

      if(this.type === 'text'){
        this.finishStep = true;
      }
      else {
        this.layers.push({options: []});
      }
    }

    else if(this.step === 'name'){
      this.step = 'options';
      this.finishStep = true;
    }

    else if(this.step === 'nameLayer'){
      if(this.layerNames[this.layerNumber]){
        this.layerNames[this.layerNumber] = this.layerName;
      }
      else {
        this.layerNames.push(this.layerName);
      }
      this.layerName = '';

      if(this.layerNumber !== 0){
        this.step = 'options';
        this.finishStep = true;
        this.goToLayer(this.selectedValueForLayer);
      }
      else {
        this.goToLayer(this.selectedValueForLayer);
      }
      
    }
  }

  loadLayer(event: string){
    this.selectedValueForLayer = event;

    if(!this.layerNames[this.layerNumber + 1]){
      this.step = 'nameLayer';
      this.finishStep = false;
    }
    else {
      this.goToLayer(this.selectedValueForLayer);
    }
  }

  goToLayer(value: string){
    for(let option of this.layers[this.layerNumber].options){
      if(option.value === value){

        // If options do not exist for this value, create empty options
        if(!option.dependentOptions){
          option.dependentOptions = [];
        }
        this.layers.push({previousValue: value, options: option.dependentOptions});
        this.layerNumber++;
      }
    }
  }

  nameLayerGoBack(){
    this.layerNames[this.layerNumber] = '';
    this.step = 'options';
  }

  layerGoBack(){
    this.layerNumber--;
    this.layers.pop();
  }

  finish(){
    let newAttribute: CategoryAttribute;
    
    if(this.type === 'options'){
      if(this.layerNames && this.layerNames.length > 1){
        newAttribute = {
          name: this.name,
          type: this.type,
          layerNames: this.layerNames,
          options: this.layers[0].options
        }
      }
      else {
        newAttribute = {
          name: this.name,
          type: this.type,
          options: this.layers[0].options
        }
      }
    }
    else {
      newAttribute = {
        name: this.name
      }
    }
    
    this.dialogRef.close({wasValid: true, data: newAttribute});
  }

  cancel(){
    this.dialogRef.close({wasValid: false});
  }

}
