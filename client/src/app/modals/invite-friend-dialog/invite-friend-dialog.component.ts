import { Component, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { Member } from 'src/app/_models/member';
import { Group } from 'src/app/_models/group';

@Component({
  selector: 'app-invite-friend-dialog',
  template: `
    <h2 class="dialog-title">Invite Friend</h2>
    <div class="dialog-content">
      <p class="mt-3">Select a friend to invite</p>
      <div class="row" *ngIf="data.friends.length > 0; else noFriends">
        <div class="col-md-3" *ngFor="let friend of data.friends" [class.selected]="friend === selectedFriend">
          <div class="friend-item my-1">
            <div class="d-flex justify-content-between align-items-center">
              <span>{{friend.userName}}</span>
              <button type="button" class="btn btn-primary"
                (click)="onInvite(friend); dialogRef.close()">Invite</button>
            </div>
          </div>
        </div>
      </div>
      <ng-template #noFriends>
        <p>No friends found.</p>
      </ng-template>
    </div>
    <div class="dialog-actions mt-2">
      <button class="btn btn-secondary" (click)="dialogRef.close()">Close</button>
    </div>
  `,
  styles: [`
    .dialog-title {
      font-weight: bold;
      color: #444;
    }
    .dialog-content .friend-item {
      border-bottom: 1px solid #eee;
      padding: 5px;
    }
    .dialog-actions {
      text-align: right;
    }
    .btn{
        background-color: #7897c5;
        border-color: #7897c5;
        padding: 3px 6px;
        font-size: 0.8rem;
    }
    .btn:hover{
        background-color: #3e6194;
    }
  `]
})
export class InviteFriendDialogComponent {
  selectedFriend: Member | null = null;

  constructor(
    public dialogRef: MatDialogRef<InviteFriendDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { friends: Member[], selectedGroup: Group, inviteUserToGroup: Function }) { }

  onNoClick(): void {
    this.dialogRef.close();
  }

  onInvite(friend: Member) {
    console.log(friend.id, this.data.selectedGroup);
    if (friend?.id && this.data?.selectedGroup?.groupId) {
      this.data.inviteUserToGroup(friend.id, this.data.selectedGroup.groupId);
    } else {
      console.error("Friend ID or Group ID is missing");
    }
  }
}
