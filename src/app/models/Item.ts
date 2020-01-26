export interface Item{
    name: string,               //name of the item
    description?: string,        //string description, optional
    tags?: string[],            //list of tags, optional
    locations: {ref: string}[], //list of references to objects, id is a string
    category: string,           //category reference, id is a string
    imageUrl?: string           //image url to hosting site, is a string
}