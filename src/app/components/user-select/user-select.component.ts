import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { WorkspaceUser } from 'src/app/models/WorkspaceUser';

@Component({
  selector: 'app-user-select',
  templateUrl: './user-select.component.html',
  styleUrls: ['./user-select.component.css']
})
export class UserSelectComponent implements OnInit {
  @Input() selectedUsers: WorkspaceUser[];
  @Input() allUsers: WorkspaceUser[];
  @Output() userUpdate = new EventEmitter<WorkspaceUser[]>();

  usersForUI: WorkspaceUser[][]; // First element of the inner array is the selected user, the rest are options that haven't been selected yet
                                 // I tried using two simpler arrays for selected vs unselected, but the UI refused to update properly with two seperate arrays

  constructor() {
  }

  ngOnInit() {
    this.buildUsersForUI();
  }

  buildUsersForUI(){
    var usersForUI: WorkspaceUser[][] = [];

    // First create a collection of users that are not selected
    let unselectedUsers: WorkspaceUser[] = [];
    this.allUsers.forEach(user => {
      if(this.selectedUsers.indexOf(user) === -1){
        unselectedUsers.push(user);
      }
    })

    // Then make individual arrays with the selected users at the front and add it to the 2D array
    for(let selected of this.selectedUsers){
      let usersForSelection: WorkspaceUser[] = [selected];
      unselectedUsers.forEach(user => {
        usersForSelection.push(user);
      })
      usersForUI.push(usersForSelection);
    }

    // Update array
    this.usersForUI = usersForUI;
    //console.log("D: " + JSON.stringify(usersForUI));
  }

  onClickUser(newUser: WorkspaceUser, oldUser: WorkspaceUser){
    // If we didn't change anything, just return
    if(newUser === oldUser){
      return;
    }
    this.selectedUsers[this.selectedUsers.indexOf(oldUser)] = newUser;
    this.updateUIandDB();
  }

  addUser(){
    // Add first user we see that is not in the selected users
    for(let user of this.allUsers){
      if(this.selectedUsers.indexOf(user) === -1){
        this.selectedUsers.push(user);
        break;
      }
    }
    this.updateUIandDB();
  }

  removeUser(){
    this.selectedUsers.pop();
    this.updateUIandDB();
  }

  updateUIandDB(){
    this.buildUsersForUI();
    this.userUpdate.emit(this.selectedUsers);
  }

}
