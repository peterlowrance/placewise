import { HierarchyObject } from './HierarchyObject';
import { Attribute } from './Attribute';

export interface Item extends HierarchyObject {
  desc?: string;
  tags?: string[];
  locations: string[];
  category: string;
  imageUrl?: string;
  attributeSuffix?: string;

  attributes?: [{  // NEEDS TO BE AN ARRAY for fuse.js searching quicker
    name: string;  // I'd rather not json a map for every item to search
    ID: string;
    value?: string;
  }];
}
