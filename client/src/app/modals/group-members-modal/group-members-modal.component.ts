import { Component, OnInit, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { AccountService } from 'src/app/_services/account.service';

export interface DialogData {
  groupMembers: any[];
}

@Component({
  selector: 'app-group-members-modal',
  templateUrl: './group-members-modal.component.html',
  styleUrls: ['./group-members-modal.component.css']
})
export class GroupMembersModalComponent implements OnInit {
  currentUserUsername: string | undefined;

  constructor(
    public dialogRef: MatDialogRef<GroupMembersModalComponent>,
    @Inject(MAT_DIALOG_DATA) public data: DialogData,
    private router: Router, private accountService: AccountService) {
    this.accountService.currentUser$.subscribe(user => this.currentUserUsername = user?.username);
  }

  ngOnInit(): void {
  }

  onNoClick(): void {
    this.dialogRef.close();
  }

  handleMemberClick(member: any): void {
    this.dialogRef.close();
    if (member.userName === this.currentUserUsername) {
      this.router.navigate(['/member/edit']);
    } else {
      this.router.navigate(['/members', member.userName], { queryParams: { tab: 'Messages' } });
    }
  }
}
