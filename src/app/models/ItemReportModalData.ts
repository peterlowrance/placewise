import { WorkspaceUser } from './WorkspaceUser';

export interface ItemReportModalData{
    valid: boolean;
    desc: string;
    users: WorkspaceUser[];
    selected: WorkspaceUser[];
}