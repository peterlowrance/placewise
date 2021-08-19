
export interface ReportStructureTemplates {
    [type: string] : ReportStructure;  // Shortened name for tables, like "Low", also used to identify it's type
}

export interface ReportStructureWrapper {  // Makes it easier if I need to keep its type attached
    type: string; 
    validLocationIDs?: string[];  // Locations that are allowed to be reported to
    alreadyReportedLocations?: string[];  // Locations we're allowed to report to have hit report limits

    reportStructure: ReportStructure;
}

export interface ReportStructure {
    name: string;  // Full name of report, like "Low and Order More"
    description: string;  // Displayed with seeing all the reports you can do
    color: string;  // Enum that translates to a hex client-side
    maximumReportTimeframe?: number;  // In hours
    maximumReportAmount?: number;  // Maximum reports allowed in a timeframe
    urgentReportSubject?: string;  // Sends the email immediately with this as the subject
    
    locations?: { // Empty = all locations, everyone
        [locationID: string] : {  
            users: string[];  // Empty = everyone
        };
    };

    // New stuff

    userInput: {  // All input listed out in the order it will be asked in
        name: string;
        description: string;
        type: string; // Possible values: text, number, date, user, image, selection\n[values separated by \n]
    }[];

    reportToUsers: string[];  // User ID's
    canChangeReportTo?: boolean;  // Doesn't exist = assumes false

    reportTextFormat: {  // This is what builds the report sent to people
        type: string;  // Possible values: text, input, date, user, itemData, itemCategoryData, itemLocationData
        data?: string; // Input name, Cat/Loc/Item element, or text
    }[];
}