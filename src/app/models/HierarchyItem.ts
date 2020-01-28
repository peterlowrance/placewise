export interface HierarchyItem {
  ID: number;
  name: string;
  parent?: HierarchyItem;
  children: HierarchyItem[];
  imageUrl?: string;
}
