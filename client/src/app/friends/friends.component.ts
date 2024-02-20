import { Component, OnInit } from '@angular/core';
import { Member } from '../_models/member';
import { Pagination } from '../_models/pagination';
import { MembersService } from '../_services/members.service';
import { User } from '../_models/user';
import { AccountService } from '../_services/account.service';
import { take } from 'rxjs/operators';
import { UserParams } from '../_models/userParams';

@Component({
  selector: 'app-friends',
  templateUrl: './friends.component.html',
  styleUrls: ['./friends.component.css']
})
export class FriendsComponent implements OnInit {
  members: Member[] = [];
  pageNumber = 1;
  pageSize = 20;
  pagination: Pagination | undefined;
  user: User | undefined;

  constructor(private memberService: MembersService, private accountService: AccountService) {
    this.accountService.currentUser$.pipe(take(1)).subscribe(user => {
      this.user = user || undefined;
    });
  }

  ngOnInit(): void {
    this.loadFriends();
  }

  loadFriends() {
    if (this.user) {
      this.memberService.getFriends(this.user.id).subscribe({
        next: response => {
          if (response) {
            this.members = response.sort((a, b) => {
              let dateA = new Date(a.lastActive);
              let dateB = new Date(b.lastActive);
              return dateB.getTime() - dateA.getTime(); // sort in descending order
            });
            console.log(this.members);
          }
        },
        error: error => console.log(error)
      });
    }
  }


  pageChanged(event: any) {
    if (this.pageNumber !== event.page) {
      this.pageNumber = event.page;
      this.loadFriends();
    }
  }
}
