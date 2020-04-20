import {Component, Inject, OnInit} from '@angular/core';
import {MatDialogRef} from '@angular/material';
import {MAT_DIALOG_DATA} from '@angular/material/dialog';
import {HierarchyItem} from '../../models/HierarchyItem';
import {AuthService} from "../../services/auth.service";
import {ImageService} from "../../services/image.service";
import {ActivatedRoute} from "@angular/router";
import {FormControl, Validators} from "@angular/forms";

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
  control = new FormControl('', Validators.required);

  imageToSave: File;
  workspace: string;
  isCategory: boolean;

  constructor(
    public dialogRef: MatDialogRef<EditHierarchyDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: TreeHierarchyItem,
    public imageService: ImageService,
    private authService: AuthService,
    private route: ActivatedRoute
  ) {
  }

  ngOnInit() {
    this.authService.getWorkspace().subscribe(
      val => this.workspace = val.name
    );
    this.isCategory = window.location.href.indexOf('categories') > -1;
  }

  onCancelClick() {
    this.dialogRef.close({data: null, action: null});
  }

  onSaveClick() {
    if (this.imageToSave) {
      this.imageService.putImage(this.imageToSave, this.data.ID).then(link => {
        this.data.imageUrl = link;
        this.dialogRef.close({data: this.data, action: 'save'});
      });
    } else {
      this.dialogRef.close({data: this.data, action: 'save'});
    }
  }

  onDeleteClick() {
    if (confirm('Are you sure you want to delete the ' + (this.isCategory ? 'category?\nCategories and items within ' : 'location?\nLocations and items within ') + this.data.name + ' will not be deleted.\nThis cannot be undone.')) {
      this.imageService.removeImage(this.data.imageUrl);
      this.dialogRef.close({data: this.data, action: 'delete'});
    }
  }

  onChangeParent() {
    this.dialogRef.close({data: this.data, action: 'changeParent'});
  }

  /**
   * Handles uploading an image file to firestorage
   * @param fileEvent
   */
  uploadImage(fileEvent: Event) {
    // cast
    const element = (fileEvent.target as HTMLInputElement);
    // only change if there was a file upload
    if (element.files && element.files[0]) {
      // set image url file
      const file = element.files[0];
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (ev) => {
        if (typeof reader.result === 'string') {
          this.data.imageUrl = reader.result;
          // set dirty and save for upload
          this.imageToSave = file;
        }
      };
    }
  }
}
