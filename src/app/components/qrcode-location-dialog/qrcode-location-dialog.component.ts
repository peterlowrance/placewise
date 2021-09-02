import { Component, Inject, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { Item } from 'src/app/models/Item';
import { HierarchyLocation } from 'src/app/models/Location';

@Component({
  selector: 'app-qrcode-location-dialog',
  templateUrl: './qrcode-location-dialog.component.html',
  styleUrls: ['./qrcode-location-dialog.component.css']
})
export class QRCodeLocationDialogComponent implements OnInit {

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: {workspaceID: string, location: HierarchyLocation},
    public dialogRef: MatDialogRef<QRCodeLocationDialogComponent>,
  ) { }

  urlToString = '';
  step = 'version';
  version = '';
  validBinID: boolean = false;
  binID: string;

  ngOnInit(): void {
    console.log(this.data.location.shelfID);
  }

  isReadyForNextStep(): boolean {
    if(this.step === 'version'){
      return this.version ?  true : false;
    }
    if(this.step === 'bin'){
      return this.validBinID;
    }

    return true;
  }

  nextStep(){
    if(this.step === 'version'){
      if(this.version === 'bin'){
        this.step = 'bin';
        return;
      }
      else {
        this.setupLocationQR();
        this.step = 'QR';
        return;
      }
    }
    if(this.step === 'bin'){
      this.setupBinQR();
      this.step = 'QR';
      return;
    }
  }

  setupBinQR(){
    this.urlToString = '/b/' + this.data.location.shelfID + '-' + this.binID; //'https://placebin.online/w/' + this.data.workspaceID.replace(' ', '%20') + '/s/l/' 
    //+ this.data.location.ID + '?bin=' + this.data.location.shelfID + '-' + this.binID;
  }

  setupLocationQR(){
    this.urlToString = 'https://placebin.online/w/' + this.data.workspaceID.replace(' ', '%20') + '/s/l/' + this.data.location.ID;
  }

  submitBinID(binInput){
    console.log(binInput.value);
    if(binInput.value.length !== 3){
      this.validBinID = false;

      if(binInput.value.length > 3){
        binInput.value = binInput.value.substring(0, 3);
      }
    }
    else {
      this.validBinID = true;
      this.binID = binInput.value;
    }
  }

  cancel(){
    this.dialogRef.close({wasValid: false});
  }
  
  back(){
    this.step = 'bin';
  }

}
