export interface HierarchyItem {
  ID: string;
  name: string;
  parent?: string;
  children: string[];
  imageUrl?: string;
}
