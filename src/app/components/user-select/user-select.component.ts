import { Component, OnInit, Input } from '@angular/core';
import { WorkspaceUser } from 'src/app/models/WorkspaceUser';

@Component({
  selector: 'app-user-select',
  templateUrl: './user-select.component.html',
  styleUrls: ['./user-select.component.css']
})
export class UserSelectComponent implements OnInit {
  @Input() selectedUsers: WorkspaceUser[];
  @Input() unselectedUsers: WorkspaceUser[];

  constructor() {

   }

  ngOnInit() {
  }

}
