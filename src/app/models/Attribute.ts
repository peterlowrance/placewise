
/**
 * Basic element anything related to an attribute has: a name. 
 * The name attaches the attribute value to it's category.
 */
export interface Attribute {
    name: string;
    type?: string;
}

/**
 * Metadata attached to a category's attribute
 * This could be completely blank, 
 * in which this is just a custom text attribute and anything goes
 */
export interface CategoryAttribute extends Attribute {
    options?: AttributeOption[];
    layerNames?: string[]; // To give names to layers like "units" and the corresponding "length"
}

/**
 * This is just a data structure containing what is needed at the level
 * of each attribute option. For efficieny and simplicity of code, each
 * value has the corresponding dependent options directly attached.
 */
export interface AttributeOption {
    value: string;
    dependentOptions?: AttributeOption[];
}


/**
 * Structure for the actual value 
 */
export interface AttributeValue extends Attribute {    
    // NOTE: We cannot just simplify all data to a string with options formatted inside 
    // because of how flexible this has been designed to be. Options can change and thier
    // order can change so we cannot rebuild the values clearly when edited. That said, 
    // we may have extra information stored with exactly what was picked. v v v
    // rawData?: any;
    // I do not want to be formating the data to a string every single load.

    // ACTUALLY I think I might store raw data in this and separate the layers with /n. 
    // The client will know what to do with it based on type. (Undefined = custom)
    value: string; // I would have called this "formattedString", but it will stay as value for legacy reasons
}