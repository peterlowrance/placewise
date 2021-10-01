
export interface HierarchyStructure {
    [id: string] : {
        parent?: string;
        children?: string[];
    }
}