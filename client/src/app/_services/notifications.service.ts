import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { FriendRequest } from '../_models/friendrequest';
import { UserGroup } from '../_models/usergroup';
import { HttpClient } from '@angular/common/http';
import { environment } from 'src/environments/environment';

@Injectable({
    providedIn: 'root'
})
export class NotificationsService {
    private friendRequestsSource = new BehaviorSubject<FriendRequest[]>([]);
    friendRequests$ = this.friendRequestsSource.asObservable();

    private userGroupsSource = new BehaviorSubject<UserGroup[]>([]);
    userGroups$ = this.userGroupsSource.asObservable();

    constructor(private http: HttpClient) {
        this.loadFriendRequests();
        this.loadUserGroups();
    }

    loadFriendRequests() {
        // Load friend requests from the API and update the friendRequestsSource
        this.http.get<FriendRequest[]>(`${environment.apiUrl}/friend-requests`).subscribe({
            next: friendRequests => {
                this.friendRequestsSource.next(friendRequests);
            },
            error: error => {
                console.error('Failed to load friend requests:', error);
            }
        });
    }

    loadUserGroups() {
        // Load user groups from the API and update the userGroupsSource
        this.http.get<UserGroup[]>(`${environment.apiUrl}/user-groups`).subscribe({
            next: userGroups => {
                this.userGroupsSource.next(userGroups);
            },
            error: error => {
                console.error('Failed to load user groups:', error);
            }
        });
    }
}
