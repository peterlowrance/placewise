import { HierarchyObject } from './HierarchyObject';
import { Attribute } from './Attribute';
import { ItemTypeReportTimestamp } from './ItemTypeReportTimestamp';
import { ItemReport } from './ItemReport';
import { AttributeValue } from './Attribute';
import { ItemTrackingArray } from './ItemTrackingPacket';

export interface Item extends HierarchyObject {
  desc?: string;
  tags?: string[];
  locations: string[];
  category: string;
  imageUrl?: string;

  attributes?: AttributeValue[];

  trackingID?: string;
  // OLD
  tracking?: [{
    locationID: string;
    binID?: string;
    type: string;
    amount: any;
  }];

  // Uses locationID to fetch metadata data from item
  locationMetadata?: 
  {
    [locationID: string] : {
      binID?: string;
      binIDRange?: string;
      trackingData?: {
        type: string;
        amount: any;
        updated: number;
      }
    }
  }

  transferTracking?: ItemTrackingArray[];

  // These get added and removed as reports are resolved
  reports?: ItemReport[];

  // This data sticks around
  lastReportTimestampByType?: ItemTypeReportTimestamp[];
}
