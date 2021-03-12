import { HierarchyObject } from './HierarchyObject';
import { Attribute } from './Attribute';
import { ItemTypeReportTimestamp } from './ItemTypeReportTimestamp';
import { ItemReport } from './ItemReport';

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
  reports?: ItemReport[];

  // This data sticks around
  lastReportTimestampByType?: ItemTypeReportTimestamp[];
}
