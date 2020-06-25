import {Component, Inject, OnInit} from '@angular/core';
import {MAT_DIALOG_DATA, MatDialogRef} from '@angular/material/dialog';

@Component({
  selector: 'app-modify-hierarchy-dialog',
  templateUrl: './modify-hierarchy-dialog.component.html',
  styleUrls: ['./modify-hierarchy-dialog.component.css']
})
export class ModifyHierarchyDialogComponent implements OnInit {

  constructor(
    public dialogRef: MatDialogRef<ModifyHierarchyDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: {hierarchy: string, singleSelection: boolean, id: string, parents: string[]}
  ) {
  }

  ngOnInit() {
  }

  onCancelClick() {
    this.dialogRef.close(null);
  }

  onSaveClick() {
    this.dialogRef.close(this.data.parents);
  }

  updateParents(event) {
    this.data.parents = event;
  }
}
