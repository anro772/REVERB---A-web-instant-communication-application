export interface FriendRequest {
    friendRequestId: number;
    requestedUsername: string;
    requesterUsername: string;
    accepted: boolean;
    handled: boolean;
}