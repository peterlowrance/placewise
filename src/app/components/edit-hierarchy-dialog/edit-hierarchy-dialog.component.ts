import {Component, Inject, OnInit} from '@angular/core';
import {MatDialogRef} from '@angular/material';
import {MAT_DIALOG_DATA} from '@angular/material/dialog';
import {HierarchyItem} from '../../models/HierarchyItem';
import {SearchService} from '../../services/search.service';

interface TreeHierarchyItem extends HierarchyItem {
  realChildren?: TreeHierarchyItem[];
  realParent?: TreeHierarchyItem;
}

@Component({
  selector: 'app-edit-hierarchy-dialog',
  templateUrl: './edit-hierarchy-dialog.component.html',
  styleUrls: ['./edit-hierarchy-dialog.component.css']
})
export class EditHierarchyDialogComponent implements OnInit {

  constructor(
    public dialogRef: MatDialogRef<EditHierarchyDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: TreeHierarchyItem
  ) {
  }

  ngOnInit() {
  }

  onCancelClick() {
    this.dialogRef.close({data: null, action: null});
  }

  onSaveClick() {
    this.dialogRef.close({data: this.data, action: 'save'});
  }

  onDeleteClick() {
    this.dialogRef.close({data: this.data, action: 'delete'});
  }

  onChangeParent() {
    this.dialogRef.close({data: this.data, action: 'changeParent'});
  }
}
