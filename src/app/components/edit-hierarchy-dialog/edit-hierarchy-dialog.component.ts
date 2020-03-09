import {Component, Inject, OnInit} from '@angular/core';
import {MatDialogRef} from '@angular/material';
import {MAT_DIALOG_DATA} from '@angular/material/dialog';
import {HierarchyItem} from '../../models/HierarchyItem';

@Component({
  selector: 'app-edit-hierarchy-dialog',
  templateUrl: './edit-hierarchy-dialog.component.html',
  styleUrls: ['./edit-hierarchy-dialog.component.css']
})
export class EditHierarchyDialogComponent implements OnInit {

  constructor(
    public dialogRef: MatDialogRef<EditHierarchyDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: HierarchyItem
  ) {
  }

  ngOnInit() {
  }

  onCancelClick() {
    this.dialogRef.close(null);
  }

  onSaveClick() {
    this.dialogRef.close(this.data);
  }
}
