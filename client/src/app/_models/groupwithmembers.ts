import { UserGroup } from './usergroup';

export interface GroupWithMembers extends UserGroup {
    members: UserGroup[];
}
