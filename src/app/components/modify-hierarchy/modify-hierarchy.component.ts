import {Component, EventEmitter, Input, OnInit, Output} from '@angular/core';
import {HierarchyItem} from '../../models/HierarchyItem';
import {NestedTreeControl} from '@angular/cdk/tree';
import {SearchService} from '../../services/search.service';
import {MatTreeNestedDataSource} from '@angular/material/tree';
import {ActivatedRoute} from '@angular/router';
import {MatDialog} from '@angular/material/dialog';
import {EditHierarchyDialogComponent} from '../edit-hierarchy-dialog/edit-hierarchy-dialog.component';
import {BehaviorSubject, EMPTY, of, zip} from 'rxjs';
import {map} from 'rxjs/operators';
import {AdminService} from "../../services/admin.service";

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
  @Input() selectMode = false;
  @Input() selectedParents: string[];
  @Output() selectedParentsOutput = new EventEmitter<string[]>();
  @Input() isCategory = true;
  changeParentNode: TreeHierarchyItem;
  treeControl = new NestedTreeControl<TreeHierarchyItem>(node => node.realChildren);
  dataSource = new MatTreeNestedDataSource<TreeHierarchyItem>();
  dataChange = new BehaviorSubject<TreeHierarchyItem[]>([]);

  hasChild = (_: number, node: TreeHierarchyItem) => node && (!!node.realChildren && node.realChildren.length > 0);

  constructor(private searchService: SearchService, private route: ActivatedRoute, public dialog: MatDialog, public adminService: AdminService) {
  }

  ngOnInit() {
    if (!this.selectMode) {
      this.isCategory = this.route.snapshot.paramMap.get('selectedHierarchy') === 'categories';
    }

    this.dataChange.subscribe(changedData => {
      this.dataSource.data = null;
      this.dataSource.data = changedData;
    });
    const appropriateHierarchy = this.isCategory ? this.searchService.getAllCategories() : this.searchService.getAllLocations();
    appropriateHierarchy.subscribe(hierarchy => {
      this.searchService.getDescendantsOfRoot('root', this.isCategory).subscribe(descOfRoot => {
        // Build the tree starting with each root node
        descOfRoot.forEach(d => this.buildTree(d, hierarchy));
        this.dataChange.next(descOfRoot);
        // If parents are selected, expand the tree to see them
        if (this.selectedParents) {
          this.selectedParents.forEach(p => {
            this.expandParents(this.findByID(p, descOfRoot));
          });
        }
      });
    });
    this.selectedParentsOutput.emit(this.selectedParents);
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
      if (realChild) {
        realChild.realParent = root;
        root.realChildren.push(realChild);
        // Recursive build tree call
        this.buildTree(realChild, allHierarchy);
      }
    }
  }

  selectedParentsToggle(node: TreeHierarchyItem) {
    // If the parent is selected, remove it
    if (this.selectedParents.indexOf(node.ID) > -1) {
      this.selectedParents = this.selectedParents.filter(el => el !== node.ID);
    } else { // Otherwise add it
      this.selectedParents.push(node.ID);
    }
    this.selectedParentsOutput.emit(this.selectedParents);
  }

  setParent(node: TreeHierarchyItem) {
    this.selectedParents = [node.ID];
    this.selectedParentsOutput.emit(this.selectedParents);
  }

  // Recursively expand nodes
  expandParents(node: TreeHierarchyItem) {
    this.treeControl.expand(node);
    if (node && node.realParent) {
      this.expandParents(node.realParent);
    }
  }

  // Depth first search using a stack
  findByID(ID: string, roots: TreeHierarchyItem[]): TreeHierarchyItem {
    const stack: TreeHierarchyItem[] = [];
    roots.forEach(r => stack.push(r));
    while (stack.length > 0) {
      const node = stack.pop();
      if (node.ID === ID) {
        return node;
      } else if (node.realChildren) {
        // Add the children to the stack
        node.realChildren.forEach(r => stack.push(r));
      }
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
      if (result.action === 'delete') {
        this.delete(result.data);
      } else if (result.action === 'changeParent') {
        this.changeParentNode = result.data;
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
      newNode.realParent = parent;
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
      newNode.realParent = null;
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

  /**
   * Delete an item from the tree
   * @param node node to be deleted
   * @param promoteChildren if true the children will become children of the node's parent. Otherwise, they will be removed
   * although they are kept as children of the removed item
   */
  delete(node: TreeHierarchyItem, promoteChildren: boolean = true) {
    // TODO: database (remember special case for when not promoting children)
    // If you have a parent, remove yourself
    if (node.realParent) {
      // Remove child from parent
      node.realParent.realChildren = node.realParent.realChildren.filter(el => el.ID !== node.ID);
      // If you have children, set them as children of your parent
      if (promoteChildren && node.realChildren) {
        // Add grandchildren to parent
        node.realParent.realChildren = node.realParent.realChildren.concat(node.realChildren);
        // Add parent to grandchildren
        node.realChildren.forEach(child => child.realParent = node.realParent);
      }
    } else { // If you have no parent, treat the dataSource.data as the parent
      this.dataSource.data = this.dataSource.data.filter(el => el.ID !== node.ID);
      if (promoteChildren && node.realChildren) {
        this.dataSource.data = this.dataSource.data.concat(node.realChildren);
        node.realChildren.forEach(child => child.realParent = null);
      }
    }
    this.dataChange.next(this.dataSource.data);
  }

  /**
   * Move a node to a new location
   * @param node node to be moved
   * @param newParent new parent of the node. If it is null, the parent is the root
   */
  move(node: TreeHierarchyItem, newParent?: TreeHierarchyItem) {
    // TODO: database
    const newParentID = newParent ? newParent.ID : 'root'
    const hasCorrectParent = (node.realParent && node.realParent.ID === newParentID) || (!node.realParent && !newParent);
    // If the node doesn't already have the correct parent, delete it and add it in the new position
    if (!hasCorrectParent) {
      this.delete(node, false);
      this.add(node, newParent);
      if (this.isCategory) {

      } else {
        this.adminService.updateLocationPosition(newParentID, node.ID, node.parent);
      }
    }
    this.changeParentNode = null;
  }

  // Recursive function to check if a node is a descendent of another node (includes itself)
  isDescendantOf(node: TreeHierarchyItem, potentialAncestor: TreeHierarchyItem) {
    if (node.ID === potentialAncestor.ID) {
      return true;
    } else if (node.realParent) {
      return this.isDescendantOf(node.realParent, potentialAncestor);
    }
    return false;
  }
}
