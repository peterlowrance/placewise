import { Input } from '@angular/core';
import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-quick-add-list',
  templateUrl: './quick-add-list.component.html',
  styleUrls: ['./quick-add-list.component.css']
})
export class QuickAddListComponent implements OnInit {
  @Input() list: string[];

  constructor() { }

  ngOnInit() {
  }

}
