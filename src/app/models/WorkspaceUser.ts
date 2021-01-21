import {User} from './User';

export interface WorkspaceUser extends User {
    role: string;
}