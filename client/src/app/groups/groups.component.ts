import { Component, OnInit } from '@angular/core';
import { GroupService } from 'src/app/_services/group.service';
import { Group } from 'src/app/_models/group';
import { UserGroup } from 'src/app/_models/usergroup';
import { AccountService } from '../_services/account.service';
import { User } from '../_models/user';
import { take } from 'rxjs';
import { MembersService } from '../_services/members.service';
import { Member } from '../_models/member';
import { MatDialog } from '@angular/material/dialog';
import { InviteFriendDialogComponent } from '../modals/invite-friend-dialog/invite-friend-dialog.component';
import { Cloudinary } from '@cloudinary/angular-5.x';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { CreateGroupDialogComponent } from '../modals/create-group-dialog/create-group-dialog.component';
import { ModalDirective } from 'ngx-bootstrap/modal';
import { ViewChild } from '@angular/core';
import { AfterViewInit, ElementRef } from '@angular/core';
import { Modal } from 'bootstrap';
import { GroupMembersModalComponent } from '../modals/group-members-modal/group-members-modal.component';
import { Router } from '@angular/router';
import 'bootstrap';

@Component({
  selector: 'app-groups',
  templateUrl: './groups.component.html',
  styleUrls: ['./groups.component.css']
})
export class GroupsComponent implements OnInit {
  groups: Group[] = [];
  userGroups: UserGroup[] = [];
  user: User | undefined;
  selectedGroup: Group | null = null;
  friends: Member[] = [];
  selectedFriend: Member | null = null;
  newGroup: { name: string, photoUrl: string } = { name: '', photoUrl: '' };
  selectedFile: File | null = null;
  groupMembers: Member[] = [];
  groupMembersModal: Modal | undefined;


  constructor(private groupService: GroupService, private accountService: AccountService,
    private memberService: MembersService, public dialog: MatDialog, private http: HttpClient,
    private cloudinary: Cloudinary, private router: Router) {
    this.accountService.currentUser$.pipe(take(1)).subscribe({
      next: user => {
        if (user) this.user = user;
      }
    });
  }

  ngOnInit(): void {
    this.loadUserGroupsAccepted();
    this.loadFriends();
  }

  openGroupMessages(group: Group) {
    this.groupService.setCurrentGroup(group);
    this.router.navigate(['/groups', group.groupId, 'messages']);
  }

  openCreateGroupModal() {
    const dialogRef = this.dialog.open(CreateGroupDialogComponent, {
      width: '500px',
      data: {
        newGroup: this.newGroup
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.newGroup = result.newGroup;
        this.selectedFile = result.selectedFile;
        this.createGroup(); // call createGroup here
      }
    });
  }

  loadGroups() {
    this.groupService.getGroupsForUser(this.user?.id!).subscribe({
      next: groups => this.groups = groups,
      error: err => console.error(err)
    });

  }

  onPhotoSelected(event: any) {
    if (event.target.files.length > 0) {
      this.selectedFile = <File>event.target.files[0];
    }
  }

  createGroup() {
    console.log(this.selectedFile);


    this.groupService.createGroup(this.newGroup.name, this.selectedFile!)
      .subscribe(() => {
        // Reset the form
        this.newGroup = { name: '', photoUrl: '' };
        // Reset the file
        this.selectedFile = null;
        // Reload the group list
        this.loadGroups();
      }, error => {
        console.error(error);
      });

  }

  loadMembers(group: any) {
    this.groupService.getMembersForGroup(group.groupId).subscribe(members => {
      this.groupMembers = members;
      this.dialog.open(GroupMembersModalComponent, {
        width: '500px',
        data: { groupMembers: this.groupMembers }
      });
    });
  }

  loadUserGroups() {
    this.groupService.getUserGroupsForUser(this.user?.id!).subscribe({
      next: groups => this.userGroups = groups,
      error: err => console.error(err)
    });
  }

  loadUserGroupsAccepted() {
    this.groupService.getUserGroupsForUserAccepted(this.user?.id!).subscribe({
      next: userGroups => {
        this.userGroups = userGroups;

        // Now load all groups
        this.groupService.getGroupsForUser(this.user?.id!).subscribe({
          next: groups => {
            // Filter the groups based on the userGroups
            this.groups = groups.filter(group =>
              this.userGroups.some(userGroup =>
                userGroup.groupId === group.groupId));
          },
          error: err => console.error(err)
        });
      },
      error: err => console.error(err)
    });
  }

  inviteUserToGroup(userId: number, groupId: number) {
    console.log(userId, groupId);
    this.groupService.inviteUserToGroup(userId, groupId).subscribe({
      next: _ => console.log('User invited to group'),
      error: err => console.error(err)
    });
  }

  loadFriends() {
    this.memberService.getFriendsForUser(this.user?.id!).subscribe({
      next: friends => this.friends = friends,

      error: err => console.error(err)
    });
  }

  selectFriend(friend: Member) {
    this.selectedFriend = friend;
  }

  openInviteFriendModal(group: Group) {
    this.selectedGroup = group;
    this.dialog.open(InviteFriendDialogComponent, {
      width: '1000px',
      maxWidth: '100%',
      data: {
        friends: this.friends,
        selectedGroup: this.selectedGroup,
        inviteUserToGroup: (userId: number, groupId: number) => this.inviteUserToGroup(userId, groupId)
      }
    });
  }
}
