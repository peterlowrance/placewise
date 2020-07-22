import {HierarchyObject} from './HierarchyObject';

export interface HierarchyItem extends HierarchyObject {
  parent?: string;
  children: string[];
  items: string[];
  imageUrl?: string;
  desc?: string;
}
