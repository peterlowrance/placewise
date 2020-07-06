import { HierarchyObject } from './HierarchyObject';

export interface Item extends HierarchyObject {
  desc?: string;
  tags?: string[];
  locations: string[];
  category: string;
  imageUrl?: string;
  attributes?: {[key:string]: {val:string}};
}
