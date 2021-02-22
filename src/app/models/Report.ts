export interface Report {
    item: {
        ID: string;
        name: string;
        imageUrl: string;
    };
    timestamp: number;
    reporter: string;
    reportedTo: string[];
    description: string;
    location: string;
}
