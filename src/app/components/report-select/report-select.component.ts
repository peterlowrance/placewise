import { Input, Output } from '@angular/core';
import { EventEmitter } from '@angular/core';
import { Component, Inject, OnInit } from '@angular/core';
import { ReportStructure } from 'src/app/models/ReportStructure';

@Component({
  selector: 'app-report-select',
  templateUrl: './report-select.component.html',
  styleUrls: ['./report-select.component.css']
})
export class ReportSelectComponent implements OnInit {

  @Input() template: ReportStructure;
  @Input() type: string; 
  @Input() disabled: boolean; 
  @Input() editing?: boolean;

  @Output() buttonClick = new EventEmitter<string>();

  constructor(
  ) { }

  ngOnInit(): void {
  }

  click(){
    this.buttonClick.emit(this.type);
  }

}
