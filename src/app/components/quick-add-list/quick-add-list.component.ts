import { EventEmitter, Input, Output } from '@angular/core';
import { Component, OnInit } from '@angular/core';
import { AdvancedAlphaNumSort } from 'src/app/utils/AdvancedAlphaNumSort';

@Component({
  selector: 'app-quick-add-list',
  templateUrl: './quick-add-list.component.html',
  styleUrls: ['./quick-add-list.component.css']
})
export class QuickAddListComponent implements OnInit {
  @Input() list: any[];
  @Input() useValue: boolean = false; // Mostly used for displaying attribute values
  @Input() layerName: string;
  @Input() conditionText: string;
  @Output() goInLayerEvent = new EventEmitter<string>();

  inputValue: string = '';

  constructor() { }

  ngOnInit() {
    if(!this.list){
      this.list = [];
    }
  }

  addValue(){
    if(this.inputValue){
      if(this.useValue){
        let inserted = false;
        let compare: number;
  
        for(let index in this.list){
          compare = AdvancedAlphaNumSort.compare(this.list[index].value, this.inputValue);
          if(compare === 0){
            return; // Don't want to add two of the same thing
          }
          else if(compare > 0){
            inserted = true;
            this.list.splice(Number.parseInt(index), 0, {value: this.inputValue});
            break;
          }
        }
  
        if(!inserted){
          this.list.push({value: this.inputValue});
        }
      }
      else {
        this.list.push(this.inputValue);
      }
      this.inputValue = '';
    }
  }

  deleteValue(value: string){
    if(this.useValue){
      for(let index in this.list){
        if(this.list[index].value === value){
          this.list.splice(Number.parseInt(index), 1);
          break;
        }
      }
    }
    else {
      for(let index in this.list){
        if(this.list[index] === value){
          this.list.splice(Number.parseInt(index), 1);
          break;
        }
      }
    }
  }

  goInLayer(option: string){
    this.goInLayerEvent.emit(option);
  }

}
