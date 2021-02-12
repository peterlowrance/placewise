import { WorkspaceUser } from './WorkspaceUser';

export interface ItemReportModalData{
    valid: boolean;
    desc: string;
    selectedUsers: WorkspaceUser[];
    allUsers: WorkspaceUser[];
}