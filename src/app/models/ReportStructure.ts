
export interface ReportStructureFirebaseCollection {
    [type: string] : ReportStructure;  // Shortened name for tables, like "Low", also used to identify it's type
}

export interface ReportStructureWrapper {  // Makes it easier if I need to keep its abbreviation attached
    type: string; 
    validLocationIDs: string[];  // Locations that are allowed to be reported to
    alreadyReportedLocations?: string[];  // Locations we're allowed to report to have hit report limits

    reportStructure: ReportStructure;
}

export interface ReportStructure {
    name: string;  // Full name of report, like "Low and Order More"
    description: string;  // Displayed with seeing all the reports you can do
    color: string;  // Enum that translates to a hex client-side
    maximumReportTimeframe?: number;  // In hours
    maximumReportAmount?: number;  // Maximum reports allowed in a timeframe
    
    locations?: { // Empty = all locations, everyone
        [locationID: string] : {  
            users: string[];  // Empty = everyone
        };
    };

    // categories?
}