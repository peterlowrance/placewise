import { Component, OnInit, Input, ChangeDetectorRef } from '@angular/core';
import { WorkspaceUser } from 'src/app/models/WorkspaceUser';

@Component({
  selector: 'app-user-select',
  templateUrl: './user-select.component.html',
  styleUrls: ['./user-select.component.css']
})
export class UserSelectComponent implements OnInit {
  @Input() selectedUsers: WorkspaceUser[];
  @Input() allUsers: WorkspaceUser[];

  unselectedUsers: WorkspaceUser[] = [];

  constructor(private changeDetection: ChangeDetectorRef) {
  }

  ngOnInit() {
    this.filterOutSelectedUsers();
  }

  onSelectNewUser(event, oldUser: WorkspaceUser){
    console.log(JSON.stringify(this.selectedUsers));
    let newUser: WorkspaceUser;
    for(let i = 0; i < this.unselectedUsers.length; i++){
      if(this.unselectedUsers[i].id === event.value){
        newUser = this.unselectedUsers[i];
      }
    }
    this.selectedUsers[this.selectedUsers.indexOf(oldUser)] = newUser;
    console.log(JSON.stringify(this.selectedUsers));
    
  }

  onClickUser(){
    console.log("honk");
    this.filterOutSelectedUsers();
    this.changeDetection.detectChanges();
  }

  filterOutSelectedUsers(){
    this.unselectedUsers = this.allUsers.filter(user => {return this.selectedUsers.indexOf(user) === -1})
  }

}
