

/**
 * This is a map of the bin IDs, not to be confused with the word "binary"
 * Each map takes a bin ID or shelf number and makes it into an item or
 * location ID.
 */

export interface BinDictionary {

    /**
     * 000-000 formated ID for each bin
     */
    bins: {[ID: string]: string};

    /**
     * First three digits of an ID is the shelf, and this is a quick reference to those
     */
    shelves: {[ID: string]: string};
}