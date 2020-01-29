import {HierarchyItem} from './HierarchyItem';


export interface Item {
  ID: number;
  name: string;
  description?: string;
  tags?: string[];
  parentLocations: HierarchyItem[];
  parentCategory: HierarchyItem;
  imageUrl?: string;
}
