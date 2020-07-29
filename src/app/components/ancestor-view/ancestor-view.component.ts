import { Component, Input, OnInit, SimpleChange } from '@angular/core';
import {NestedTreeControl} from '@angular/cdk/tree';
import {MatTreeNestedDataSource} from '@angular/material/tree';
import {HierarchyItem} from 'src/app/models/HierarchyItem';

interface TreeNode {
  name: string;
  imageUrl: string;
  children: TreeNode[];
  ID: string;
}

@Component({
  selector: 'app-ancestor-view',
  templateUrl: './ancestor-view.component.html',
  styleUrls: ['./ancestor-view.component.css']
})
export class AncestorViewComponent implements OnInit {
  @Input() parentsToDisplay: HierarchyItem[][];

  constructor(
  ) { }

  // tree components from material source
  treeControl = new NestedTreeControl<TreeNode>(node => node.children);

  dataSource = new MatTreeNestedDataSource<TreeNode>();

  // Parent of heirarchy, does nothing now
  parent: TreeNode = {name: null, imageUrl: null, children: null, ID: null};

  toTree = (h: HierarchyItem) => ({name: h.name, imageUrl: h.imageUrl, children: [], ID: h.ID});
  hasChild = (_: number, node: TreeNode) => !!node.children && node.children.length > 0;

  ngOnInit(){

  }

  ngOnChanges(changes: {[propKey: string]: SimpleChange}) {
    this.parent = {name: null, imageUrl: null, children: null, ID: null};
    if(this.parentsToDisplay){
      // need to loop over first elements, pop off, and combine any like
      // first pop off all top level locations, those are the root
      for (const h of this.parentsToDisplay) {
        const head = this.toTree(h.pop());
        this.parent = this.parent.ID === null ? head : this.parent;
        // go over all list and keep building node list
        this.parent.children.push(this.convertList(h));
      }

      // now collapse duplicates
      this.collapseNodes(this.parent);

      this.dataSource.data = this.parent.children;

      //check through to see if we have one child
      let oneAncestor = true;
      let data = this.dataSource.data;
      if (data && data.length == 1) {
        //while I still have children and they aren't leaves
        while (data[0].children.length > 0) {
          if (data[0].children.length > 1) {
            //check to see if these children are leaves
            for (let child of data[0].children) {
              if (child.children.length > 0) {
                oneAncestor = false;
                break;
              }
            }
            if (!oneAncestor) break;
          }
          data = data[0].children;
        }
      } else oneAncestor = false;

      this.treeControl.dataNodes = this.dataSource.data;
      if (oneAncestor) this.treeControl.expandAll();
    }
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
    if (node && node.children) {
      const m = {}, newarr = [];
      for (let i = 0; i < node.children.length; i++) {
        const v = node.children[i];
        if (v) {
          if (!m[v.ID]) {
            m[v.ID] = v;
            newarr.push(v);
          } else {
            m[v.ID].children = m[v.ID].children.concat(v.children);
          }
        }
      }
      node.children = newarr;
      for (const child of node.children) {
        this.collapseNodes(child);
      }
    }
  }

}
