
export interface ItemTrackingTransfer {
    to: string;  // ID of the receiving location of the transfer, we don't need to track the ohter end because the array holding this info can tell us that
    user: string;  // ID of user
    timestamp: string;  // Unix timestamp in milliseconds
    amount: number;  // I hope you can figure this one out
    message?: string;  // Optional message - make editable for future?
}