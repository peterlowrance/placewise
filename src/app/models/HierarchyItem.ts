export interface HierarchyItem {
  ID: string;
  name: string;
  parent?: HierarchyItem;
  children: HierarchyItem[];
  imageUrl?: string;
}
