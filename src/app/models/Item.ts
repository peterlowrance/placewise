export interface Item {
  ID: string;
  name: string;
  desc?: string;
  tags?: string[];
  locations: string[];
  category: string;
  imageUrl?: string;
  attributes?: {[key:string]: {val:string}};
}
