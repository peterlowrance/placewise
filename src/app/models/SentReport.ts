import { Item } from './Item';

export interface SentReport {
    item: string;
    desc: string;
    user: string;
    reportedTo: string[];
    timestamp: number;
    ID: string;
    trueItem: Item;
    userName: string;
}
