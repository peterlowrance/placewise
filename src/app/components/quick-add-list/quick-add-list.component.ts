import { Input } from '@angular/core';
import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-quick-add-list',
  templateUrl: './quick-add-list.component.html',
  styleUrls: ['./quick-add-list.component.css']
})
export class QuickAddListComponent implements OnInit {
  @Input() list: any[];
  @Input() useValue: boolean = false; // Mostly used for displaying attribute values

  inputValue: string = '';

  constructor() { }

  ngOnInit() {
    console.log(this.list);
  }

  addValue(){
    if(this.useValue){
      this.list.push({value: this.inputValue});
    }
    else {
      this.list.push(this.inputValue);
    }
    this.inputValue = '';
  }

}
