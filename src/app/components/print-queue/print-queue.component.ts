import { Component, OnInit } from '@angular/core';
import { MatTabsModule } from '@angular/material/tabs';

export interface QueueItem {
  itemName: string;
  printName: boolean;
  printBin: boolean;
  printUniversal: boolean;
}

const FILLER_DATA: QueueItem[] = [
  {itemName: "Boned", printName: true, printBin: false, printUniversal: false},
  {itemName: "Beered", printName: true, printBin: false, printUniversal: false},
  {itemName: "Beard", printName: false, printBin: false, printUniversal: false},
  {itemName: "Boned", printName: false, printBin: false, printUniversal: false},
  {itemName: "Bamed", printName: false, printBin: false, printUniversal: false},
  {itemName: "Boned", printName: true, printBin: false, printUniversal: false},
];

@Component({
  selector: 'app-print-queue',
  templateUrl: './print-queue.component.html',
  styleUrls: ['./print-queue.component.css'],
})
export class PrintQueueComponent implements OnInit {

  itemsInQueue = FILLER_DATA;
  displayedColumns: string[] = ['itemName', 'printName', 'printBin'];

  constructor() { }

  ngOnInit(): void {
  }

}
