import { Component, OnDestroy, OnInit } from '@angular/core';
import { ChangeDetectionStrategy, Input, ViewChild } from '@angular/core';
import { NgForm } from '@angular/forms';
import { Message } from 'src/app/_models/message';
import { GroupService } from '../_services/group.service';
import { ActivatedRoute } from '@angular/router';
import { ChangeDetectorRef } from '@angular/core';
import { ElementRef } from '@angular/core';
import { ScrollBottomDirective } from './scroll-bottom.directive';
import { Group } from '../_models/group';
import { AccountService } from '../_services/account.service';
import { take } from 'rxjs/operators';
import { InviteFriendDialogComponent } from '../modals/invite-friend-dialog/invite-friend-dialog.component';
import { MatDialog } from '@angular/material/dialog';
import { Member } from '../_models/member';
import { MembersService } from '../_services/members.service';
import { GroupMembersModalComponent } from '../modals/group-members-modal/group-members-modal.component';

@Component({
  selector: 'app-group-messages',
  templateUrl: './group-messages.component.html',
  styleUrls: ['./group-messages.component.css']
})
export class GroupMessagesComponent implements OnInit, OnDestroy {
  @ViewChild('messageForm') messageForm?: NgForm
  @ViewChild('scrollMe') private scrollMe?: ElementRef;
  @Input() groupId?: number;
  messageContent = '';
  loading = false;
  messages: Message[] = [];
  group: Group = { groupId: 0, userId: 0, name: '', photoUrl: '' };
  currentUsername: string = '';
  user: any;
  friends: Member[] = [];
  groupMembers: Member[] = [];

  constructor(public groupService: GroupService, private route: ActivatedRoute,
    private cdRef: ChangeDetectorRef, private accountService: AccountService,
  private dialog:MatDialog, private memberService:MembersService) { }

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      this.groupId = +params['id']; // (+) converts string 'id' to a number
      this.groupService.getGroupById(this.groupId!).subscribe(group => {
        this.groupService.setCurrentGroup(group);
        this.group = group; // store the group data in the group object

        // initialize the messages array here
        this.groupService.getGroupMessages(this.groupId!).subscribe(messages => {
          this.messages = messages;
          console.log('Group messages:', this.messages)
        }, error => {
          console.error('Error loading group messages:', error);
        });
      });
    });
    this.accountService.currentUser$.pipe(take(1)).subscribe(user => {
      if (user) {
        this.user = user;
        this.currentUsername = user.username;
        this.groupService.createHubConnection(user, this.groupId!.toString());
      }
    });
    this.groupService.groupMessages$.subscribe(messages => {
      this.messages = messages;
    });
    this.loadFriends();
  }

  loadFriends() {
    this.memberService.getFriendsForUser(this.user?.id!).subscribe({
      next: friends => this.friends = friends,

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

  loadMembers(group: any) {
    this.groupService.getMembersForGroup(group.groupId).subscribe(members => {
      this.groupMembers = members;
      this.dialog.open(GroupMembersModalComponent, {
        width: '500px',
        data: { groupMembers: this.groupMembers }
      });
    });
  }

  openInviteFriendModal(group: Group) {
    this.dialog.open(InviteFriendDialogComponent, {
      width: '1000px',
      maxWidth: '100%',
      data: {
        friends: this.friends,
        selectedGroup: this.group,
        inviteUserToGroup: (userId: number, groupId: number) => this.inviteUserToGroup(userId, groupId)
      }
    });
  }

  ngOnDestroy(): void {
    this.groupService.stopHubConnection();
  }

  sendGroupMessageInvoke() {
    if (this.groupId && this.messageForm) {
      this.loading = true;
      this.groupService.sendGroupMessageInvoke(this.groupId, this.messageContent, this.currentUsername)
        .then(() => {
          this.messageForm!.reset();
        })
        .finally(() => this.loading = false);
    }
  }
  
  

  scrollToBottom() {
    if (this.scrollMe) {
      setTimeout(() => {
        this.scrollMe!.nativeElement.scrollTop = this.scrollMe!.nativeElement.scrollHeight;
      });
    }
  }

  sendGroupMessage() {
    if (!this.groupId) return;
    this.loading = true;
    this.groupService.sendGroupMessage(this.groupId, this.messageContent).subscribe(() => {
      this.messageForm?.reset();

      // Fetch the group messages again after sending a new message.
      this.groupService.getGroupMessages(this.groupId!).subscribe(messages => {
        this.messages = messages;

        this.scrollToBottom();

        // Force Angular to check for changes in case the scroll height has changed.
        // This should be done after the scroll position is updated.
        this.cdRef.detectChanges();

      }, error => {
        console.error('Error loading group messages:', error);
      });

      this.loading = false;
    }, error => {
      console.log(error);
      this.loading = false;
    });
  }


}
