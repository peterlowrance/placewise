import { ItemTrackingInfo } from "./ItemTrackingInfo";


/**
 * These are sectioned into pieces holding 100 sets of tracking info. All of the pieces are linked together.
 */
export interface ItemTrackingPacket {

    itemID: string;  // The thing this tracking is for
    ID?: string;  // Self ID for when loaded into the client. This should not be saved to Firebase as that would be redundant

    info: ItemTrackingInfo[];
    
    nextPacket?: string; // ID of another packet
}