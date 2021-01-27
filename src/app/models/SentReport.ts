import { Item } from './Item';

export interface SentReport {
    item: string;
    desc: string;
    user: string;
    sentTo: string[];
    timestamp: number;
    ID: string;
    trueItem: Item;
    userName: string;
}
