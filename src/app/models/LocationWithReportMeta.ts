import { HierarchyLocation } from "./Location";

export interface LocationWithReportMeta extends HierarchyLocation {

    //defaultUsersForReports?: string[];    Maybe in the future

    lowReportFull: boolean;
    emptyReportFull: boolean;
    anyReportFull: boolean;
    
}