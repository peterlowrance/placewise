import {Component, Inject, OnInit} from '@angular/core';
import {MatDialogRef} from '@angular/material';
import {MAT_DIALOG_DATA} from '@angular/material/dialog';
import {HierarchyItem} from '../../models/HierarchyItem';
import {AuthService} from "../../services/auth.service";
import {ImageService} from "../../services/image.service";
import {ActivatedRoute} from "@angular/router";
import {FormControl, Validators} from "@angular/forms";
import {AdminService} from '../../services/admin.service';

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
    public adminService: AdminService,
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
      this.imageService.putImage(this.data.imageUrl, this.data.ID).then(link => {
        this.data.imageUrl = link;
        this.dialogRef.close({data: this.data, action: 'save'});
      });
    } else {
      this.dialogRef.close({data: this.data, action: 'save'});
    }
    // this.dialogRef.afterClosed().subscribe(result => {
    //   if (result) {
    //     if (result.action === 'delete') {
    //       this.delete(result.data);
    //     } else if (result.action === 'changeParent') {
    //       // If this is a new item, add it
    //       if (!result.data.ID) {
    //         this.add(result.data);
    //       }
    //       //this.changeParentNode = result.data;   --- TODO: YIKES ---
    //     } else if (!this.data && result.data) {
    //       this.add(result.data);
    //     } else if (this.data && result.data) {
    //       this.update(result.data);
    //     }
    //   }
    // });
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
          this.imageService.resizeImage(reader.result).then(url => {
            this.data.imageUrl = url;
            this.imageToSave = file;
          });
        }
      };
    }
  }

  // /**
  //  * Add or update an item to the hierarchy
  //  * @param parent the parent of the item to be set
  //  * @param newNode the node to be set
  //  */
  // add(newNode: TreeHierarchyItem, parent?: TreeHierarchyItem, updateDB: boolean = true) {
  //   if (updateDB) {
  //     const parentID = parent ? parent.ID : 'root';
  //     newNode.parent = parentID;
  //     if (this.isCategory) {
  //       this.adminService.addCategory(newNode, parentID);
  //     } else {
  //       this.adminService.addLocation(newNode, parentID);
  //     }
  //   }
  //   // Add new node to parent
  //   if (parent) {
  //     // Initialize realChildren if needed
  //     if (!parent.realChildren) {
  //       parent.realChildren = [];
  //     }
  //     newNode.realParent = parent;
  //     // If the item is already a child, update it
  //     const indexOfChild = parent.realChildren.indexOf(newNode);
  //     if (indexOfChild > -1) {
  //       parent.realChildren[indexOfChild] = newNode;
  //     } else { // Otherwise add the new item
  //       parent.realChildren.push(newNode);
  //     }
  //     // Expand parent
  //     if (!this.treeControl.isExpanded(parent)) {
  //       this.treeControl.expand(parent);
  //     }
  //   } else { // Otherwise, add item to root levels
  //     newNode.realParent = null;
  //     // Check if the item already exists as a root child
  //     const indexOfChild = this.dataChange.value.indexOf(newNode);
  //     if (indexOfChild > -1) {
  //       this.dataChange[indexOfChild] = newNode;
  //       this.dataChange.next(this.dataChange.value);
  //     } else { // Otherwise, add new item to root level
  //       this.dataChange.next([
  //         ...this.dataChange.value,
  //         newNode
  //       ]);
  //     }
  //   }
  //   // Set data
  //   this.dataChange.next(this.dataChange.value);
  // }

  // update(node: TreeHierarchyItem) {
  //   this.adminService.updateHierarchy(this.toHierarchyItem(node), this.isCategory);
  // }

  // /**
  //  * Delete an item from the tree
  //  * @param node node to be deleted
  //  * @param promoteChildren if true the children will become children of the node's parent. Otherwise, they will be removed
  //  * although they are kept as children of the removed item
  //  */
  // delete(node: TreeHierarchyItem, promoteChildren: boolean = true, updateDB: boolean = true) {
  //   if (updateDB) {
  //     if (this.isCategory) {
  //       this.adminService.removeCategory(this.toHierarchyItem(node));
  //     } else {
  //       this.adminService.removeLocation(this.toHierarchyItem(node));
  //     }
  //   }
  //   // If you have a parent, remove yourself
  //   if (node.realParent) {
  //     // Remove child from parent
  //     node.realParent.realChildren = node.realParent.realChildren.filter(el => el.ID !== node.ID);
  //     // If you have children, set them as children of your parent
  //     if (promoteChildren && node.realChildren) {
  //       // Add grandchildren to parent
  //       node.realParent.realChildren = node.realParent.realChildren.concat(node.realChildren);
  //       // Add parent to grandchildren
  //       node.realChildren.forEach(child => child.realParent = node.realParent);
  //     }
  //   } else { // If you have no parent, treat the dataSource.data as the parent
  //     this.dataSource.data = this.dataSource.data.filter(el => el.ID !== node.ID);
  //     if (promoteChildren && node.realChildren) {
  //       this.dataSource.data = this.dataSource.data.concat(node.realChildren);
  //       node.realChildren.forEach(child => child.realParent = null);
  //     }
  //   }
  //   this.dataChange.next(this.dataSource.data);
  // }

  // /**
  //  * Move a node to a new location
  //  * @param node node to be moved
  //  * @param newParent new parent of the node. If it is null, the parent is the root
  //  */
  // move(node: TreeHierarchyItem, newParent?: TreeHierarchyItem) {
  //   const newParentID = newParent ? newParent.ID : 'root';
  //   const hasCorrectParent = (node.realParent && node.realParent.ID === newParentID) || (!node.realParent && !newParent);
  //   // If the node doesn't already have the correct parent, delete it and add it in the new position
  //   if (!hasCorrectParent) {
  //     this.delete(node, false, false);
  //     this.add(node, newParent, false);
  //     if (this.isCategory) {
  //       this.adminService.updateCategoryPosition(newParentID, node.ID, node.parent);
  //     } else {
  //       this.adminService.updateLocationPosition(newParentID, node.ID, node.parent);
  //     }
  //   }
  //   this.changeParentNode = null;
  //   this.openEditModal(node);
  //   // In .1 seconds, expand the parents of the moved item
  //   setTimeout(() => { this.expandParents(this.findByID(node.ID, this.dataSource.data));}, 100);
  // }
}
