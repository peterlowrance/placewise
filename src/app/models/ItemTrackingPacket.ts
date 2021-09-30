import { ItemTrackingTransfer } from "./ItemTrackingTransfer";


export interface ItemTrackingPacket extends ItemTrackingArray {
    // ID of this packet
    ID?: string;

    // The thing this tracking is for
    itemID: string;
}

export interface ItemTrackingArray {
    // This points to the next packet that holds data on these types of transfers
    nextPacket?: string;

    // The locations this is regarding, in no particular order.
    location1: string; 
    location2: string;

    data: ItemTrackingTransfer[];
}