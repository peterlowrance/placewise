import {HierarchyItem} from './HierarchyItem';

// Named "HierarchyLocation" from conflict with "Location" in TS/JS
export interface HierarchyLocation extends HierarchyItem {

    //defaultUsersForReports?: string[];    Maybe in the future
    shelfID?: string;
    
}
