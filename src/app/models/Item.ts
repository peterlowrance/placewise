import { HierarchyObject } from './HierarchyObject';
import { Attribute } from './Attribute';

export interface Item extends HierarchyObject {
  desc?: string;
  tags?: string[];
  locations: string[];
  category: string;
  imageUrl?: string;

  attributes?: [{  // NEEDS TO BE AN ARRAY for fuse.js searching quicker
    name: string;  // I'd rather not json a map for every item to search
    ID: string;
    value?: string;
  }];

  tracking?: [{
    locationID: string;
    type: string;
    amount: any;
  }];

  // These get added and removed as reports are resolved
  reports?: [{
    location: string;
    report: string;
    timestamp: number;
  }];

  // This data sticks around
  lastReportTimestampByType?: [{
    type: string;
    location: string;
    timestamp: number;
  }];
}
