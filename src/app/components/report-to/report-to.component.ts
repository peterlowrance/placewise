import { Component, Input, OnInit, Output } from '@angular/core';
import { User } from 'src/app/models/User';

@Component({
  selector: 'app-report-to',
  templateUrl: './report-to.component.html',
  styleUrls: ['./report-to.component.css']
})

export class ReportToComponent implements OnInit {
  @Input() selectedUsers: User[]; // This will stay as "users" because it may not always be admins in the future
  @Output() selectedUsersOutput: User[];
  unselectedUsers: User[]; // Other users to select (CURRENTLY ONLY ADMINS)

  constructor() { 

  }

  ngOnInit() {
  }

}
