
export interface ReportStructureFirebaseCollection {
    [abbreviation: string] : ReportStructure; // Shortened name for tables, like "Low"
}

export interface ReportStructureWrapper {  // Makes it easier if I need to keep its abbreviation attached
    abbreviation: string; 
    validLocationIDs?: string[];  // Locations that are allowed to be reported to

    reportStructure: ReportStructure;
}

export interface ReportStructure {
    name: string;  // Full name of report, like "Low and Order More"
    description: string;  // Displayed with seeing all the reports you can do
    color: string;  // Enum that translates to a hex client-side
    
    locations: {
        [locationID: string] : {  // Empty = all locations, everyone
            users: string[];  // Empty = everyone
        };
    };

    // categories?
}