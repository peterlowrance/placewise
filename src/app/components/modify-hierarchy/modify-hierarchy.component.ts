import {Component, OnInit} from '@angular/core';
import {HierarchyItem} from '../../models/HierarchyItem';
import {NestedTreeControl} from '@angular/cdk/tree';
import {SearchService} from '../../services/search.service';
import {MatTreeNestedDataSource} from '@angular/material/tree';
import {ActivatedRoute} from '@angular/router';
import {MatDialog} from '@angular/material/dialog';
import {EditHierarchyDialogComponent} from '../edit-hierarchy-dialog/edit-hierarchy-dialog.component';
import {BehaviorSubject, of, zip} from 'rxjs';
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
      .pipe(map(x => x[0].concat(x[1])));
  });
  dataSource = new MatTreeNestedDataSource<TreeHierarchyItem>();
  dataChange = new BehaviorSubject<TreeHierarchyItem[]>([]);

  hasChild = (_: number, node: TreeHierarchyItem) => (!!node.children && node.children.length > 0) ||
    (!!node.addedChildren && node.addedChildren.length > 0)

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
    const dialogRef = this.dialog.open(EditHierarchyDialogComponent, {
      width: '75%',
      data: node
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        console.log(result);
      }
      /*this.errorDesc = result;
      // if it's valid, build and isue report, else leave
      if (this.errorDesc.valid) {
        this.report.description = this.errorDesc.desc;
        this.report.item.name = this.item.name;
        this.report.item.ID = this.item.ID;
        this.report.item.imageUrl = this.item.imageUrl;
        // TODO: input reporter name from auth service
        // this.report.reporter
        this.report.reportDate = new Date().toDateString();
      }*/
    });
  }

  /**
   * Add a new item to the hierarchy
   * @param parent the parent of the item to be added
   * @param newNode the new node to be added
   */
  addItem(parent: TreeHierarchyItem, newNode: TreeHierarchyItem) {
    // Add new node to parent
    if (!parent.addedChildren) {
      parent.addedChildren = [newNode];
    } else {
      parent.addedChildren.push(newNode);
    }
    // Expand parent
    if (!this.treeControl.isExpanded(parent)) {
      this.treeControl.expand(parent);
    }
    // Set data
    this.dataChange.next(this.dataChange.value);
  }
}
