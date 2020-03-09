import {Component, Inject, OnInit} from '@angular/core';
import {MatDialogRef} from '@angular/material';
import {MAT_DIALOG_DATA} from '@angular/material/dialog';
import {HierarchyItem} from '../../models/HierarchyItem';
import {SearchService} from "../../services/search.service";

@Component({
  selector: 'app-edit-hierarchy-dialog',
  templateUrl: './edit-hierarchy-dialog.component.html',
  styleUrls: ['./edit-hierarchy-dialog.component.css']
})
export class EditHierarchyDialogComponent implements OnInit {
  parentName = '';

  constructor(
    public dialogRef: MatDialogRef<EditHierarchyDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: HierarchyItem,
    private searchService: SearchService
  ) {
  }

  ngOnInit() {
    this.searchService.getLocation(this.data.parent).subscribe(parent => {
      if (parent) {
        this.parentName = parent.name;
      }
    });
    this.searchService.getCategory(this.data.parent).subscribe(parent => {
      if (parent) {
        this.parentName = parent.name;
      }
    });
  }

  onCancelClick() {
    this.dialogRef.close(null);
  }

  onSaveClick() {
    this.dialogRef.close(this.data);
  }
}
