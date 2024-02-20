export interface UserGroup {
    groupId: number;
    userId: number;
    isOwner: boolean;
    accepted: boolean;
    handled: boolean;
    groupName?: string;
}