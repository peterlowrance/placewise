import { Item } from './Item';

export interface SentReport {
    item: string;
    desc: string;
    user: string;
    type: string;
    reportedTo: string[];
    timestamp: number;
    location: string;
    ID: string;
    trueItem: Item;
    userName: string;
}
