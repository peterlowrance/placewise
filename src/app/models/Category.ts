import {HierarchyItem} from './HierarchyItem';

export interface Category extends HierarchyItem {
  parent?: Category;
  children: Category[];
}
