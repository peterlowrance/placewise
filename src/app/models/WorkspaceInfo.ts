export interface WorkspaceInfo{
    name: string;   //the workspace's actual name
    id: string; //the workspace's id
    defaultUsersForReports: string[]; // If there were not default users assigned to a location or its parents, it will default to this
}