import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { Observable, of } from 'rxjs';
import { User } from '../_models/user';
import { AccountService } from '../_services/account.service';
import { GroupService } from '../_services/group.service';
import { UserGroup } from '../_models/usergroup';
import { take } from 'rxjs/operators';
import { HttpClient } from '@angular/common/http';
import { FriendRequest } from '../_models/friendrequest';
import { environment } from 'src/environments/environment';
import { forkJoin } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import { EMPTY } from 'rxjs';
import { map } from 'rxjs/operators';
import { first } from 'rxjs/operators';
import * as signalR from '@microsoft/signalr';
import { HttpTransportType, HubConnection, HubConnectionBuilder } from '@microsoft/signalr';
import { BusyService } from '../_services/busy.service';

@Component({
  selector: 'app-nav',
  templateUrl: './nav.component.html',
  styleUrls: ['./nav.component.css']
})
export class NavComponent implements OnInit {
  model: any = {};
  friendRequests: FriendRequest[] = [];
  groupInvitations: UserGroup[] = [];
  notificationsCount = 0;
  userId: number | undefined;
  hubUrl = environment.hubUrl;

  private hubConnection?: HubConnection;

  constructor(public accountService: AccountService, private router: Router,
    private toastr: ToastrService, private groupService: GroupService, private http: HttpClient, private busyService: BusyService) {
    this.accountService.currentUser$.subscribe(user => {
      if (user) {
        this.userId = user.id;  // 'id' is the property that should hold the user id in your user model
        this.loadNotifications();
        //this.startConnection();
        this.createHubConnection(user);
      }
    });
  }

  ngOnInit(): void {
    this.loadNotifications();
  }

  login() {
    this.accountService.login(this.model).subscribe({
      next: _ => {
        this.model = {};
      }
    })
  }

  loadNotifications() {

    forkJoin({
      friendRequests: this.loadFriendRequests(),
      groupInvitations: this.loadGroupInvitations()
    }).subscribe({
      next: ({ friendRequests, groupInvitations }) => {
        const unhandledFriendRequests = friendRequests.filter(friendRequest => !friendRequest.handled);
        //console.log(unhandledFriendRequests)
        const unhandledGroupInvitations = groupInvitations.filter(groupInvitation => !groupInvitation.handled);

        this.notificationsCount = unhandledFriendRequests.length + unhandledGroupInvitations.length;
      },
      error: error => {
        console.error(error);
      }
    });
  }


  loadFriendRequests(): Observable<FriendRequest[]> {
    if (this.userId != 0) {
      return this.http.get<FriendRequest[]>(`${environment.apiUrl}friendrequest/${this.userId}/friend-requests`);
    }
    //throw new Error("User Id is not defined");
    return of([]);
  }

  loadGroupInvitations(): Observable<UserGroup[]> {
    return this.accountService.currentUser$.pipe(
      first(), // <-- Only take the first emitted value
      switchMap(user => {
        if (user) {
          return this.groupService.getUserGroupsForUser(user.id).pipe(
            map(response => {
              // Filter the response to only include UserGroup objects for the current user
              // and where the user is not the owner
              const invitations = response.map(group => {
                return group.members.find(member => member.userId === user.id);
              }).filter(member => member !== undefined && member.isOwner === false) as UserGroup[];

              invitations.forEach(invitation => {
                this.groupService.getGroupById(invitation.groupId).subscribe(group => {
                  invitation.groupName = group.name;
                });
              });

              return invitations;
            })
          );
        }
        return EMPTY;
      }),
    );
  }

  startConnection() {
    this.accountService.currentUser$.subscribe((user) => {
      if (user) {
        this.hubConnection = new signalR.HubConnectionBuilder()
          .withUrl(`${environment.hubUrl}notification`, {
            accessTokenFactory: () => user.token || '',
            skipNegotiation: true,
            transport: signalR.HttpTransportType.WebSockets
          })
          .configureLogging(signalR.LogLevel.Information)
          .build();

        // Start the connection
        this.hubConnection
          .start()
          .then(() => {
            console.log('SignalR connection started');
            this.addReceiveNotificationListener();
          })
          .catch((error) => console.error('Error starting SignalR connection:', error));
      }
    });
  }

  createHubConnection(user: User) {
    this.busyService.busy();
    this.hubConnection = new HubConnectionBuilder()
      .withUrl(this.hubUrl + 'notification', {
        accessTokenFactory: () => user.token,
        transport: HttpTransportType.WebSockets,
        skipNegotiation: true
      })
      .withAutomaticReconnect()
      .build();

    this.hubConnection.start().then(() => {
      console.log('Connection started!');
      this.addReceiveNotificationListener();
    })
      .catch(error => console.log('Error while starting connection: ', error))
      .finally(() => this.busyService.idle());

    // this.hubConnection.on('ReceiveMessageThread', messages => {
  }

  //`${environment.hubUrl}notification`

  addReceiveNotificationListener() {
    if (this.hubConnection) {
      this.hubConnection.on('ReceiveFriendRequests', (friendRequests: any | any[]) => {
        if (Array.isArray(friendRequests)) {
          friendRequests.forEach(friendRequest => {
            if (!friendRequest.handled) {
              const message = `You have a friend request from ${friendRequest.requesterUsername}`;
              this.toastr.success(message, 'New Notification');
            }
          });
        } else {
          // Handle the case when a single friend request is received
          const friendRequest = friendRequests;
          if (!friendRequest.handled) {
            const message = `You have a friend request from ${friendRequest.requesterUsername}`;
            this.toastr.success(message, 'New Notification');
          }
        }

        // Update notifications count
        this.loadNotifications();
      });

      this.hubConnection.on('ReceiveGroupInvitations', (groupInvitations: any | any[]) => {
        if (Array.isArray(groupInvitations)) {
          console.log(groupInvitations);
          groupInvitations.forEach(groupInvitation => {
            if (!groupInvitation.handled) {
              const message = `You have been invited to join ${groupInvitation.group.name}`;
              this.toastr.success(message, 'New Notification');
            }
          });
        } else {
          // Handle the case when a single group invitation is received
          const groupInvitation = groupInvitations;
          console.log("group inv", groupInvitation)
          if (!groupInvitation.members[0].handled) {
            this.groupService.getGroupById(groupInvitation.groupId).subscribe(group => {
              const message = `You have been invited to join ${group.name}`;
              this.toastr.success(message, 'New Notification');
            });
          }

        }

        // Update notifications count
        this.loadNotifications();
      });

    }
  }




  // addReceiveNotificationListener() {
  //   if (this.hubConnection) {
  //     this.hubConnection.on('ReceiveNotifications', (notifications: any[]) => {
  //       console.log('Received notifications:', notifications);
  //       notifications.forEach(notification => {

  //         let friendRequestsReceived = notification.appUser.friendRequestsReceived;
  //         let userGroups = notification.group.userGroups;

  //         friendRequestsReceived.forEach((request: any) => {
  //           if (!request.handled) {
  //             const message = `You have a friend request from ${request.requester.userName}`;
  //             this.toastr.success(message, 'New Notification');
  //           }
  //         });

  //         userGroups.forEach((group: any) => {
  //           if (!group.handled) {
  //             const message = `You have been invited to join ${group.name}`;
  //             this.toastr.success(message, 'New Notification');
  //           }
  //         });

  //       });

  //       // Update notifications count
  //       this.loadNotifications();
  //     });
  //   }
  // }

  handleNotification(notification: any) {
    // Process the notification and update the notifications count accordingly
    this.notificationsCount++;
  }

  ngOnDestroy(): void {
    if (this.hubConnection) {
      this.hubConnection.off('ReceiveNotifications');
      this.hubConnection.stop();
    }
  }

  logout() {
    this.accountService.logout();
    this.router.navigateByUrl('/');
  }
}
