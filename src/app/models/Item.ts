export interface Item {
  ID: string;
  name: string;
  description?: string;
  tags?: string[];
  parentLocations: string[];
  parentCategory: string;
  imageUrl?: string;
}
