// adapted tree control from https://material.angular.io/components/tree/examples
import {Component, OnDestroy, OnInit} from '@angular/core';
import {MatTreeNestedDataSource} from '@angular/material/tree';
import {Item} from 'src/app/models/Item';
import {Report} from 'src/app/models/Report';
import {ItemReportModalData} from 'src/app/models/ItemReportModalData';
import {ActivatedRoute} from '@angular/router';
import {SearchService} from 'src/app/services/search.service';
import {MatDialog} from '@angular/material/dialog';
import {ReportDialogComponent} from '../report-dialog/report-dialog.component';
import {HierarchyItem} from 'src/app/models/HierarchyItem';
import {NestedTreeControl} from '@angular/cdk/tree';
import {AuthService} from '../../services/auth.service';
import {FormBuilder} from '@angular/forms';
import {MatChipInputEvent} from '@angular/material/chips';
import {COMMA, ENTER, SPACE} from '@angular/cdk/keycodes';
import {AdminService} from 'src/app/services/admin.service';
import {ImageService} from '../../services/image.service';
import {ModifyHierarchyDialogComponent} from '../modify-hierarchy-dialog/modify-hierarchy-dialog.component';
import {NavService} from 'src/app/services/nav.service';
import {Subscription} from 'rxjs';
import {Location} from '@angular/common';


interface TreeNode {
  name: string;
  imageUrl: string;
  children: TreeNode[];
  ID: string;
}

@Component({
  selector: 'app-item',
  templateUrl: './item.component.html',
  styleUrls: ['./item.component.css']
})
export class ItemComponent implements OnInit, OnDestroy {

  constructor(
    private searchService: SearchService,
    private adminService: AdminService,
    private routeLocation: Location,
    private route: ActivatedRoute,
    public dialog: MatDialog,
    private authService: AuthService,
    private formBuilder: FormBuilder,
    private imageService: ImageService,
    private navService: NavService,
  ) {
  }

  readonly separatorKeysCodes: number[] = [ENTER, COMMA, SPACE];

  id: string; // item id
  item: Item; // item returned by id
  previousItem: Item; // previous item, before edits are made
  imageToSave: File = null; // the image to upload when saved

  loading = true;  // whether the page is actively loading
  report: Report = {
    description: '',
    item: {
      ID: '0',
      name: '',
      imageUrl: ''
    },
    reportDate: '',
    reporter: ''
  }; // user report
  errorDesc: ItemReportModalData = {valid: false, desc: ''}; // user-reported error description
  expanded = false;  // is the more info panel expanded

  // Parent of heirarchy, does nothing now
  parent: TreeNode = {name: null, imageUrl: null, children: null, ID: null};
  // category of the item
  category: HierarchyItem;

  // tree components from material source
  treeControl = new NestedTreeControl<TreeNode>(node => node.children);

  dataSource = new MatTreeNestedDataSource<TreeNode>();


  role: string; // user role for editing
  dirty: boolean; // is the item edited dirty

  textEditFields: {
    name: boolean;
    desc: boolean;
    tags: boolean;
  } = {name: false, desc: false, tags: false};


  deleteSub: Subscription; // delete subscription

  toTree = (h: HierarchyItem) => ({name: h.name, imageUrl: h.imageUrl, children: [], ID: h.ID});

  hasChild = (_: number, node: TreeNode) => !!node.children && node.children.length > 0;

  ngOnInit() {
    // retrieve id
    this.id = this.route.snapshot.paramMap.get('id');

    // get the item from the id
    this.searchService.getItem(this.id).subscribe(item => {
      // get the item ref
      this.item = item;
      this.previousItem = JSON.parse(JSON.stringify(item)); // deep copy
      // get all locations and filter
      this.searchService.getAncestorsOfItem(item.ID).subscribe(hierarchy => {
        // need to loop over first elements, pop off, and combine any like
        // first pop off all top level locations, those are the root
        for (const h of hierarchy) {
          const head = this.toTree(h.pop());
          this.parent = this.parent.ID === null ? head : this.parent;
          // go over all list and keep building node list
          this.parent.children.push(this.convertList(h));
        }

        // now collapse duplicates
        this.collapseNodes(this.parent);

        this.dataSource.data = this.parent.children;
      });

      // Load image for item
      console.log(this.item.imageUrl);
      if (this.item.imageUrl != null) {
        this.imageService.getImage(item.imageUrl).subscribe(link => {
          console.log(link);
          this.item.imageUrl = link;
        });
      }

      // get the category information
      this.searchService.getCategory(item.category).subscribe(val => this.category = val);
    });

    // get user role
    this.role = this.authService.role;

    // set up admin change forms
    // this.nameForm = this.formBuilder.group({name: this.nameControl})

    // set up link to delete
    this.deleteSub = this.navService.getDeleteMessage().subscribe(val => this.requestDelete(val));
  }

  ngOnDestroy() {
    this.deleteSub.unsubscribe();
  }

  convertList(items: HierarchyItem[]): TreeNode {
    if (items.length === 0) {
      return null;
    } else {
      const level = this.toTree(items.pop());
      const child = this.convertList(items);

      // add if not null
      if (child) {
        level.children.push(child);
      }
      return level;
    }
  }

  /**
   * Collapses a single level of the node hierarchy
   * Adapted with insight from: https://stackoverflow.com/questions/16747798/delete-duplicate-elements-from-an-array
   * @param node
   */
  collapseNodes(node: TreeNode) {
    const m = {}, newarr = [];
    for (let i = 0; i < node.children.length; i++) {
      const v = node.children[i];
      if (!m[v.ID]) {
        m[v.ID] = v;
        newarr.push(v);
      } else {
        m[v.ID].children = m[v.ID].children.concat(v.children);
      }
    }
    node.children = newarr;
    for (const child of node.children) {
      this.collapseNodes(child);
    }
  }

  toggleMoreInfo() {
    this.expanded = !this.expanded;
  }

  createReport() {
    // reset report data, ensure clicking out defaults to fail and no double send
    this.errorDesc = {valid: false, desc: ''};

    const dialogRef = this.dialog.open(ReportDialogComponent, {
      width: '240px',
      data: {
        valid: this.errorDesc.valid,
        desc: this.errorDesc.desc
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      this.errorDesc = result;
      // if it's valid, build and isue report, else leave
      if (this.errorDesc.valid) {
        this.report.description = this.errorDesc.desc;
        this.report.item.name = this.item.name;
        this.report.item.ID = this.item.ID;
        this.report.item.imageUrl = this.item.imageUrl;
        // TODO: input reporter name from auth service
        // this.report.reporter
        this.report.reportDate = new Date().toDateString();

        // TODO: issue report
        this.adminService.placeReport(this.report.item.ID, this.report.description);
      }
    });
  }

  /**
   * A field edit handler
   * @param field the string name of the item field to edit
   */
  editField(field: string) {
    // set edit field value to enable state change, then set focus
    switch (field) {
      case 'name':
        this.textEditFields.name = true;
        // focus
        // this.nameField.nativeElement.focus();
        break;
      case 'desc':
        this.textEditFields.desc = true;
        // focus

        break;
      case 'tags':
        this.textEditFields.tags = true;
        // focus

        break;
      default:
        break;
    }
  }

  editLocation() {
    // Deep copy locations
    const oldLocations = JSON.parse(JSON.stringify(this.item.locations));
    const dialogRef = this.dialog.open(ModifyHierarchyDialogComponent, {
      width: '75%',
      data: {hierarchy: 'locations', parents: this.item.locations}
    });
    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        console.log(result);
        console.log(oldLocations);
        this.item.locations = result;
        this.adminService.updateItem(this.item, null, oldLocations);
        setTimeout(() => location.reload(), 100);
      }
    });
  }

  editCategory() {
    const oldCategory = this.item.category ? this.item.category : 'root';
    const dialogRef = this.dialog.open(ModifyHierarchyDialogComponent, {
      width: '75%',
      data: {hierarchy: 'categories', parents: [this.item.category]}
    });
    dialogRef.afterClosed().subscribe(result => {
      if (result && result.length > 0) {
        this.item.category = result[0];
        this.searchService.getCategory(result[0]).subscribe(c => this.category = c);
        console.log('updating');
        this.adminService.updateItem(this.item, oldCategory, null);
      }
    });
  }

  /**
   * Handles logic for submitting the name
   */
  onNameSubmit() {
    // check to see if name is valid
    if (this.item.name !== '') {
      // this.item.name = this.nameForm.value;
      // hide control
      this.textEditFields.name = false;
    } else {
      this.item.name = this.previousItem.name;
      // TODO: show snackbar
    }

    // check for dirtiness
    this.checkDirty();
  }

  /**
   * Handles logic for submitting the description
   */
  onDescSubmit() {
    // check to see if name is valid
    if (this.item.desc !== '') {
      // this.item.name = this.nameForm.value;
      // hide control
      this.textEditFields.desc = false;
    } else {
      this.item.desc = this.previousItem.desc;
      // TODO: show snackbar
    }

    // check for dirtiness
    this.checkDirty();
  }

  /**
   * Handles uploading an image file to firestorage
   * @param event
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
          this.item.imageUrl = reader.result;
          // set dirty and save for upload
          this.checkDirty();
          this.imageToSave = file;
          console.log(this.item.imageUrl);
        }
      };
    }
  }

  /** Tag control: https://material.angular.io/components/chips/examples */

  /**
   * Adds a tag to the list
   * @param event tag input event
   */
  add(event: MatChipInputEvent): void {
    const input = event.input;
    const value = event.value;

    // Add our fruit
    if ((value || '').trim()) {
      this.item.tags.push(value.trim());
    }

    // Reset the input value
    if (input) {
      input.value = '';
    }

    // check dirty
    this.checkDirty();
  }

  /**
   * Removes a tag from the list
   * @param tag string tag to remove
   */
  removeTag(tag: string): void {
    const index = this.item.tags.indexOf(tag);

    if (index >= 0) {
      this.item.tags.splice(index, 1);
    }

    // check dirty
    this.checkDirty();
  }

  /**
   * Checks to see if the current item is dirty (edited)
   */
  checkDirty() {
    if (this.item === this.previousItem) {
      this.dirty = false;
      return false;
    } else {
      this.dirty = true;
      return true;
    }
  }

  /**
   * Saves the item to the database, sets not dirty, and sets previousItem
   */
  saveItem() {
    // first, upload the image if edited
    if (this.previousItem.imageUrl !== this.item.imageUrl) {
      // if the URL previously existed, just upload, else get new imageURL
      if (this.previousItem.imageUrl === null || this.previousItem.imageUrl === '') {
        this.item.imageUrl = this.imageToSave.name;
      } else {
        this.item.imageUrl = this.previousItem.imageUrl;
      }
      // post to upload image
      if (this.imageToSave) {
        this.imageService.putImage(this.imageToSave, this.item.imageUrl).subscribe(link => this.item.imageUrl = link);
      }
    }
    // post to save item, on uccess update
    console.log('saving');
    this.adminService.updateItem(this.item, null, null).subscribe(val => {
      if (val) {
        this.previousItem = JSON.parse(JSON.stringify(this.item));
        this.dirty = false;
        alert('Item save successful');
      } else {
        alert('Item save failed');
      }
    });
  }

  /**
   * Deletes the item when given the signal
   * @param signal True for delete requested
   */
  requestDelete(signal: boolean) {
    if (signal) {
      if (confirm('Are you sure you want to delete the item?\nThis cannot be undone.')) {
        //TODO: remove image
        this.adminService.removeItem(this.item.ID).subscribe(val => {
          if (val) {
            alert('Item successfully deleted.');
            this.navService.returnState();
            this.routeLocation.back();
          } else alert('Item deletion failed.');
        });
      }
    }
  }

}
