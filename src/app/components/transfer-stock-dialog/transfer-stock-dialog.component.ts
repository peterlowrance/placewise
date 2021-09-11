import { Component, Inject, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';
import { time } from 'console';
import { Item } from 'src/app/models/Item';
import { HierarchyLocation } from 'src/app/models/Location';

@Component({
  selector: 'app-move-stock-dialog',
  templateUrl: './transfer-stock-dialog.component.html',
  styleUrls: ['./transfer-stock-dialog.component.css']
})
export class TransferStockDialogComponent implements OnInit {

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: {workspaceID: string, item: Item, locations: HierarchyLocation}
  ) { }

  step: string = 'from';
  from: string;

  ngOnInit(): void {
  }

  convertTimestampToReadableTime(timestamp: number): string {
    let date = new Date(timestamp);

    let dateString = date.toLocaleDateString('en-US');
    // Remove the first two digits of the year to shorten it a litte
    dateString = dateString.substr(0, dateString.length - 4) + dateString.substr(dateString.length - 2, dateString.length - 1)


    let hour = date.getHours();
    let minutes = date.getMinutes();
    let AMorPM = "AM";

    
    if(hour > 11){
      if(hour > 12){
        hour -= 12;
      }

      AMorPM = "PM";
    }
    if(hour === 0){
      hour = 12;
    }

    return dateString + " at " + hour + ":" + (minutes < 10 ? '0'+minutes : minutes) + " " + AMorPM;
  }

  isReadyForNextStep(): boolean {
    if(this.step === 'from'){
      return this.from ? true : false;
    }
    return true;
  }

  nextStep(){
    if(this.step === 'from'){
      if(this.from === 'other'){
        this.step = 'from-other';
      }
      else {
        this.step = 'amount';
      }
    }

    else if(this.step === 'from-other'){
      this.step = 'amount';
    }
  }

}
