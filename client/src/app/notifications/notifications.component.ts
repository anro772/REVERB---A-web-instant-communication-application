import { Component, OnInit } from '@angular/core';
import { Member } from '../_models/member';
import { MembersService } from '../_services/members.service';
import { AccountService } from '../_services/account.service';
import { FriendRequest } from '../_models/friendrequest';
import { UserGroup } from '../_models/usergroup';
import { GroupService } from '../_services/group.service';
import { ToastrService } from 'ngx-toastr';

@Component({
  selector: 'app-notifications',
  templateUrl: './notifications.component.html',
  styleUrls: ['./notifications.component.css']
})
export class NotificationsComponent implements OnInit {
  friendRequests: FriendRequest[] = [];
  groupInvitations: UserGroup[] = [];

  constructor(private memberService: MembersService, private accountService: AccountService,
    private groupService: GroupService, private toastr: ToastrService) { }

  ngOnInit(): void {
    this.loadFriendRequests();
    this.loadGroupInvitations();
  }

  loadGroupInvitations() {
    this.accountService.currentUser$.subscribe(user => {
      if (user) {
        this.groupService.getUserGroupsForUser(user.id).subscribe(response => {
          // Filter the response to only include UserGroup objects for the current user
          // and where the user is not the owner
          this.groupInvitations = response.map(group => {
            return group.members.find(member => member.userId === user.id);
          }).filter(member => member !== undefined && member.isOwner === false) as UserGroup[];

          // Retrieve group name for each invitation
          this.groupInvitations.forEach(groupInvitation => {
            this.groupService.getGroupById(groupInvitation.groupId).subscribe(group => {
              groupInvitation.groupName = group.name;
            });
          });
          this.groupInvitations = this.groupInvitations.reverse();
        });
      }
    });
  }

  acceptGroupInvitation(groupInvitation: UserGroup) {
    this.groupService.acceptUserGroupInvitation(groupInvitation.groupId).subscribe(response => {
      //groupInvitation.accepted = true; // Mark invitation as accepted locally
      //groupInvitation.handled = true; // Mark invitation as handled locally
      this.toastr.success('Group invitation accepted!');
      setTimeout(() => {
        window.location.reload(); // Refresh the page
      }, 1000);
      setTimeout(() => {
        groupInvitation.accepted = true;
        groupInvitation.handled = true;
      }, 2000);
    }, error => {
      this.toastr.error('Failed to accept group invitation');
      console.error(error); // Or handle error as necessary
    });
  }

  declineGroupInvitation(groupInvitation: UserGroup) {
    this.groupService.declineUserGroupInvitation(groupInvitation.groupId).subscribe(response => {
      //groupInvitation.accepted = false; // Mark invitation as declined locally
      //groupInvitation.handled = true; // Mark invitation as handled locally
      this.toastr.success('Group invitation declined!');
      setTimeout(() => {
        window.location.reload(); // Refresh the page
      }, 1000);
      setTimeout(() => {
        groupInvitation.accepted = true;
        groupInvitation.handled = true;
      }, 2000);
    }, error => {
      this.toastr.error('Failed to decline group invitation');
      console.error(error); // Or handle error as necessary
    });
  }


  loadFriendRequests() {
    this.accountService.currentUser$.subscribe(user => {
      if (user && user.id != 0) {
        this.memberService.getFriendRequests(user.id).subscribe(response => {
          this.friendRequests = response.reverse();
          console.log(this.friendRequests);
        });
      }
    });
  }

  acceptFriendRequest(friendRequest: FriendRequest) {
    this.memberService.acceptFriendRequest(friendRequest.friendRequestId).subscribe(response => {
      //friendRequest.accepted = true; // Mark request as accepted locally
      //friendRequest.handled = true; // Mark request as handled locally
      this.toastr.success('Friend request accepted!'); // toastr success message
      setTimeout(() => {
        window.location.reload(); // Refresh the page
      }, 1000);
      setTimeout(() => {
        friendRequest.accepted = true;
        friendRequest.handled = true;
      }, 2000);
    }, error => {
      this.toastr.error('Failed to accept friend request'); // toastr error message
      console.error(error); // Or handle error as necessary
    });
  }

  declineFriendRequest(friendRequest: FriendRequest) {
    this.memberService.declineFriendRequest(friendRequest.friendRequestId).subscribe(response => {
      //friendRequest.accepted = false; // Mark request as declined locally
      //friendRequest.handled = true; // Mark request as handled locally
      this.toastr.success('Friend request declined!'); // toastr success message
      setTimeout(() => {
        window.location.reload(); // Refresh the page
      }, 1000);
      setTimeout(() => {
        friendRequest.accepted = true;
        friendRequest.handled = true;
      }, 2000);
    }, error => {
      this.toastr.error('Failed to decline friend request'); // toastr error message
      console.error(error); // Or handle error as necessary
    });
  }

}
