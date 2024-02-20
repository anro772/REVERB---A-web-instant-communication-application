import { Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { NgxGalleryAnimation, NgxGalleryImage, NgxGalleryOptions } from '@kolkov/ngx-gallery';
import { TabDirective, TabsetComponent } from 'ngx-bootstrap/tabs';
import { take } from 'rxjs';
import { Member } from 'src/app/_models/member';
import { Message } from 'src/app/_models/message';
import { User } from 'src/app/_models/user';
import { AccountService } from 'src/app/_services/account.service';
import { MembersService } from 'src/app/_services/members.service';
import { MessageService } from 'src/app/_services/message.service';
import { PresenceService } from 'src/app/_services/presence.service';
import { ToastrService } from 'ngx-toastr';
import { BusyService } from 'src/app/_services/busy.service';
import { VideoChatService } from 'src/app/_services/videochat.service';
import { setTime } from 'ngx-bootstrap/chronos/utils/date-setters';

@Component({
  selector: 'app-member-detail',
  templateUrl: './member-detail.component.html',
  styleUrls: ['./member-detail.component.css']
})
export class MemberDetailComponent implements OnInit, OnDestroy {
  @ViewChild('memberTabs', { static: true }) memberTabs?: TabsetComponent;
  member: Member = {} as Member;
  galleryOptions: NgxGalleryOptions[] = [];
  galleryImages: NgxGalleryImage[] = [];
  activeTab?: TabDirective;
  messages: Message[] = [];
  user?: User;
  areFriends: boolean = false;

  constructor(private accountService: AccountService, private route: ActivatedRoute,
    private messageService: MessageService, public presenceService: PresenceService,
    private router: Router, private memberService: MembersService, private toastr: ToastrService,
    private busyService: BusyService, private videoChatService: VideoChatService) {
    this.accountService.currentUser$.pipe(take(1)).subscribe({
      next: user => {
        if (user) this.user = user;
      }
    });
    this.router.routeReuseStrategy.shouldReuseRoute = () => false;
  }

  ngOnInit(): void {
    this.route.data.subscribe({
      next: data => this.member = data['member']
    })

    this.route.queryParams.subscribe({
      next: params => {
        params['tab'] && this.selectTab(params['tab'])
      }
    })

    this.galleryOptions = [
      {
        width: '500px',
        height: '500px',
        imagePercent: 100,
        thumbnailsColumns: 4,
        imageAnimation: NgxGalleryAnimation.Slide,
        preview: false
      }
    ]

    this.galleryImages = this.getImages();

    this.checkFriendshipStatus();
  }

  ngAfterViewInit() {
    this.route.queryParams.subscribe({
      next: params => {
        params['tab']
        if (params['tab'] === 'Messages') {
          console.log('messages connection created')
          this.messageService.createHubConnection(this.user!, this.member.userName);
          console.log('hub connection created');
        }
        else {
          this.messageService.stopHubConnection();
        }
      }
    })
  }

  ngOnDestroy(): void {
    this.messageService.stopHubConnection();
  }

  navigateToVideoChat() {
    // Create or get a room identifier (you'll need to implement this)
    let roomId = this.videoChatService.createRoom(this.user!.id, this.member.id);
    // Navigate to the video chat route with the room identifier
    this.router.navigate(['/videochat', roomId]);
  }


  getImages() {
    if (!this.member || !this.member.photo) return [];
    const imageUrl = this.member.photo.url;
    return [{
      small: imageUrl,
      medium: imageUrl,
      big: imageUrl
    }];
  }

  checkFriendshipStatus() {
    if (this.user)
      this.memberService.areFriends(this.user.id, this.member.id).subscribe(response => {
        this.areFriends = response;
      });
  }

  isBusy() {
    return this.busyService.isBusy();
  }

  sendFriendRequest() {
    this.memberService.sendFriendRequest(this.member.userName).subscribe({
      next: _ => {
        this.toastr.success('Friend request sent');
        setTimeout(() => {
          window.location.reload();
        }
          , 1000);
      },
      error: err => {
        console.error(err);
        this.toastr.error('Error sending friend request');
        setTimeout(() => {
          window.location.reload();
        }
          , 1000);
      }
    });

  }

  selectTab(heading: string) {
    if (this.memberTabs) {
      this.memberTabs.tabs.find(x => x.heading === heading)!.active = true
    }
  }

  loadMessages() {
    if (this.member) {
      this.messageService.getMessageThread(this.member.userName).subscribe({
        next: messages => this.messages = messages
      })
    }
  }

  onTabActivated(data: TabDirective) { //deprecated
    this.activeTab = data;
    console.log(this.activeTab)
    //console.log(this.activeTab)
    if (this.activeTab.heading === 'Messages' && this.user) {

    }
  }
}
