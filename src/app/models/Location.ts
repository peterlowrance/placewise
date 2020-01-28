import {HierarchyItem} from './HierarchyItem';

export interface Location extends HierarchyItem {
  parent?: Location;
  children: Location[];
}
