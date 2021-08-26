
export interface ItemTrackingInfo {
    from: string;  // ID of location
    to: string;  // ID of location
    user: string;  // ID of user
    timestamp: number;  // Unix timestamp in milliseconds
    amount: number;  // I hope you know what this is
    message: string;  // User inputted message
}