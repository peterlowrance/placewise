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
  addedChildren?: TreeHierarchyItem[];
}

@Component({
  selector: 'app-modify-hierarchy',
  templateUrl: './modify-hierarchy.component.html',
  styleUrls: ['./modify-hierarchy.component.css']
})
export class ModifyHierarchyComponent implements OnInit {
  isCategory: boolean;
  treeControl = new NestedTreeControl<TreeHierarchyItem>(node => {
    // Merge the children from the database and that additional children
    return zip(this.searchService.getDescendantsOfRoot(node.ID, this.isCategory), of(node.addedChildren))
      .pipe(map(x => x[1] ? x[0].concat(x[1]) : x[0]));
  });
  dataSource = new MatTreeNestedDataSource<TreeHierarchyItem>();
  dataChange = new BehaviorSubject<TreeHierarchyItem[]>([]);

  hasChild = (_: number, node: TreeHierarchyItem) => node && ((!!node.children && node.children.length > 0) ||
    (!!node.addedChildren && node.addedChildren.length > 0))

  constructor(private searchService: SearchService, private route: ActivatedRoute, public dialog: MatDialog) {
  }

  ngOnInit() {
    this.isCategory = this.route.snapshot.paramMap.get('selectedHierarchy') === 'categories';
    this.dataChange.subscribe(changedData => {
      this.dataSource.data = null;
      this.dataSource.data = changedData;
    });
    this.searchService.getDescendantsOfRoot('root', this.isCategory).subscribe(descOfRoot => {
      this.dataChange.next(descOfRoot);
    });
  }

  openEditModal(node: TreeHierarchyItem) {
    if (!node) {
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
      console.log(this.dataSource.data);
      // If the result was saved
      this.setItem(result);
      /*if (result) {
        this.getAppropriateHierarchyItem(result.parent).subscribe(parent => {
          this.setItem(parent, result);
        });
      }*/
    });
  }

  /**
   * Add or update an item to the hierarchy
   * @param parent the parent of the item to be set
   * @param newNode the node to be set
   */
  setItem(newNode: TreeHierarchyItem, parent?: TreeHierarchyItem) {
    // TODO: add/update the database
    // Add new node to parent
    if (parent) {
      // Check if item already exists
      if (parent.children.indexOf(newNode.ID) > -1 || (parent.addedChildren && parent.addedChildren.indexOf(newNode) > -1)) {
        console.log('already a child of its parent');
      }
      if (!parent.addedChildren) {
        parent.addedChildren = [newNode];
      } else {
        parent.addedChildren.push(newNode);
      }
      // Expand parent
      if (!this.treeControl.isExpanded(parent)) {
        this.treeControl.expand(parent);
      }
    } else {
      // Check if the item already exists as a root child
      const indexOfNewItem = this.dataChange.value.indexOf(newNode);
      if (indexOfNewItem > -1) {
        console.log('already exists!!!');
        this.dataChange[indexOfNewItem] = newNode;
        this.dataChange.next(this.dataChange.value);
      } else {
        this.dataChange.next([
          ...this.dataChange.value,
          newNode
        ]);
      }
    }

    // Set data
    this.dataChange.next(this.dataChange.value);
  }
}
