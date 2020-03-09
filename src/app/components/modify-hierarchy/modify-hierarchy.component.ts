import {Component, OnInit} from '@angular/core';
import {HierarchyItem} from '../../models/HierarchyItem';
import {NestedTreeControl} from '@angular/cdk/tree';
import {SearchService} from '../../services/search.service';
import {MatTreeNestedDataSource} from '@angular/material/tree';
import {ActivatedRoute} from '@angular/router';
import {MatDialog} from '@angular/material/dialog';
import {EditHierarchyDialogComponent} from '../edit-hierarchy-dialog/edit-hierarchy-dialog.component';
import {BehaviorSubject, EMPTY, of, zip} from 'rxjs';
import {map} from 'rxjs/operators';

interface TreeHierarchyItem extends HierarchyItem {
  realChildren?: TreeHierarchyItem[];
  realParent?: TreeHierarchyItem;
}

@Component({
  selector: 'app-modify-hierarchy',
  templateUrl: './modify-hierarchy.component.html',
  styleUrls: ['./modify-hierarchy.component.css']
})
export class ModifyHierarchyComponent implements OnInit {
  isCategory: boolean;
  treeControl = new NestedTreeControl<TreeHierarchyItem>(node => node.realChildren);
  dataSource = new MatTreeNestedDataSource<TreeHierarchyItem>();
  dataChange = new BehaviorSubject<TreeHierarchyItem[]>([]);

  hasChild = (_: number, node: TreeHierarchyItem) => node && (!!node.realChildren && node.realChildren.length > 0);

  constructor(private searchService: SearchService, private route: ActivatedRoute, public dialog: MatDialog) {
  }

  ngOnInit() {
    this.isCategory = this.route.snapshot.paramMap.get('selectedHierarchy') === 'categories';
    this.dataChange.subscribe(changedData => {
      this.dataSource.data = null;
      this.dataSource.data = changedData;
    });
    const appropriateHierarchy = this.isCategory ? this.searchService.getAllCategories() : this.searchService.getAllLocations();
    appropriateHierarchy.subscribe(hierarchy => {
      this.searchService.getDescendantsOfRoot('root', this.isCategory).subscribe(descOfRoot => {
        // Build the tree starting with each root node
        descOfRoot.forEach(d => this.buildTree(d, hierarchy));
        console.log(descOfRoot);
        this.dataChange.next(descOfRoot);
      });
    });
  }

  /**
   * Recursive build tree
   * @param root the node to attach children to
   * @param allHierarchy the entire hierarchy
   */
  buildTree(root: TreeHierarchyItem, allHierarchy: TreeHierarchyItem[]) {
    if (!root || !root.children) {
      return;
    }
    if (!root.realChildren) {
      root.realChildren = [];
    }
    for (const child of root.children) {
      const realChild = allHierarchy.find(e => e.ID === child);
      realChild.realParent = root;
      root.realChildren.push(realChild);
      // Recursive build tree call
      this.buildTree(realChild, allHierarchy);
    }
  }

  openEditModal(node: TreeHierarchyItem) {
    const newItem = !node;
    if (newItem) {
      node = {
        name: '',
        children: [],
        items: [],
        parent: 'root'
      };
    }
    const dialogRef = this.dialog.open(EditHierarchyDialogComponent, {
      width: '75%',
      data: node
    });
    dialogRef.afterClosed().subscribe(result => {
      // If a string was returned, delete the item with that ID
      if (result.action === 'delete') {
        this.delete(result.data);
      } else if (newItem && result.data) {
        this.add(result.data);
      } else if (!newItem && result.data) {
        this.update(result.data);
      }
    });
  }

  /**
   * Add or update an item to the hierarchy
   * @param parent the parent of the item to be set
   * @param newNode the node to be set
   */
  add(newNode: TreeHierarchyItem, parent?: TreeHierarchyItem) {
    console.log('adding new item');
    // TODO: add/update the database
    // Add new node to parent
    if (parent) {
      // Initialize realChildren if needed
      if (!parent.realChildren) {
        parent.realChildren = [];
      }
      // If the item is already a child, update it
      const indexOfChild = parent.realChildren.indexOf(newNode);
      if (indexOfChild > -1) {
        console.log('already a child of its parent');
        parent.realChildren[indexOfChild] = newNode;
      } else { // Otherwise add the new item
        parent.realChildren.push(newNode);
      }
      // Expand parent
      if (!this.treeControl.isExpanded(parent)) {
        this.treeControl.expand(parent);
      }
    } else { // Otherwise, add item to root levels
      // Check if the item already exists as a root child
      const indexOfChild = this.dataChange.value.indexOf(newNode);
      if (indexOfChild > -1) {
        console.log('already exists!!!');
        this.dataChange[indexOfChild] = newNode;
        this.dataChange.next(this.dataChange.value);
      } else { // Otherwise, add new item to root level
        this.dataChange.next([
          ...this.dataChange.value,
          newNode
        ]);
      }
    }
    // Set data
    this.dataChange.next(this.dataChange.value);
  }

  update(node: TreeHierarchyItem) {
    console.log('update ' + node.ID);
  }

  delete(node: TreeHierarchyItem) {
    // If you have a parent, remove yourself
    if (node.realParent) {
      // Remove child from parent
      node.realParent.realChildren = node.realParent.realChildren.filter(el => el.ID !== node.ID);
      // If you have children, set them as children of your parent
      if (node.realChildren) {
        // Add grandchildren to parent
        node.realParent.realChildren = node.realParent.realChildren.concat(node.realChildren);
        // Add parent to grandchildren
        node.realChildren.forEach(child => child.realParent = node.realParent);
      }
    } else { // If you have no parent, treat the dataSource.data as the parent
      this.dataSource.data = this.dataSource.data.filter(el => el.ID !== node.ID);
      if (node.realChildren) {
        this.dataSource.data = this.dataSource.data.concat(node.realChildren);
        node.realChildren.forEach(child => child.realParent = null);
      }
    }
    this.dataChange.next(this.dataSource.data);
  }
}
