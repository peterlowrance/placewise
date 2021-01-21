import { Item } from './Item';

export interface SentReport {
    item: string;
    desc: string;
    user: string;
    sentTo: string[];
    ID: string;
    trueItem: Item;
    userName: string;
}
