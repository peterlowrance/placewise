import { Component, Inject, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { Item } from 'src/app/models/Item';
import { HierarchyLocation } from 'src/app/models/Location';

@Component({
  selector: 'app-qrcode-item-dialog',
  templateUrl: './qrcode-item-dialog.component.html',
  styleUrls: ['./qrcode-item-dialog.component.css']
})
export class QRCodeItemDialogComponent implements OnInit {

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: {workspaceID: string, item: Item, locations: HierarchyLocation[]},
    public dialogRef: MatDialogRef<QRCodeItemDialogComponent>,
  ) { }

  urlToString = '';
  step = 'version';
  version = '';
  isUniversalQR = false;
  isBin: boolean;

  ngOnInit(): void {
  }

  isReadyForNextStep(): boolean {
    if(this.step === 'version'){
      return this.version ?  true : false;
    }

    return true;
  }

  nextStep(){
    if(this.step === 'version'){
      if(this.version === 'bin'){
        if(this.data.locations.length > 1){
          this.step = 'where';
        }
        else {
          this.isBin = true;
          this.setupBinQR(this.data.item.locationMetadata[this.data.locations[0].ID].binID);
          this.step = 'QR';
        }
      }
      else {
        this.isBin = false;
        this.setupItemQR();
        this.step = 'QR';
      }
    }
  }

  setupBinQR(binID){
    this.urlToString = '/b/' + binID;
  }

  setupItemQR(){
    this.urlToString = '/i/' + this.data.item.ID;
  }

  setupUniversalBinQR(binID){
    this.urlToString = 'https://placebin.online/w/' + this.data.workspaceID.replace(' ', '%20') + '/s/l/' 
    + this.data.locations[0].ID + '?bin=' + binID;
  }

  setupUniversalItemQR(){
    this.urlToString = 'https://placebin.online/w/' + this.data.workspaceID.replace(' ', '%20') + '/i/' + this.data.item.ID;
  }

  toggleUniversalQR(event){
    if(event.checked){ // If we are using universal QR
      if(this.isBin){
        this.setupUniversalBinQR(this.data.item.locationMetadata[this.data.locations[0].ID].binID);
      }
      else {
        this.setupUniversalItemQR();
      }
    }
    else {
      if(this.isBin){
        this.setupBinQR(this.data.item.locationMetadata[this.data.locations[0].ID].binID);
      }
      else {
        this.setupItemQR();
      }
    }
  }

  cancel(){
    this.dialogRef.close({wasValid: false});
  }

}
