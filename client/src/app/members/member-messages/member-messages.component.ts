import { ChangeDetectionStrategy, Component, ElementRef, Input, OnInit, ViewChild } from '@angular/core';
import { NgForm } from '@angular/forms';
import { Message } from 'src/app/_models/message';
import { MessageService } from 'src/app/_services/message.service';
import { AccountService } from 'src/app/_services/account.service';
import { take } from 'rxjs';
import { PresenceService } from 'src/app/_services/presence.service';
import { Member } from 'src/app/_models/member';
import { ActivatedRoute } from '@angular/router';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-member-messages',
  templateUrl: './member-messages.component.html',
  styleUrls: ['./member-messages.component.css']
})
export class MemberMessagesComponent implements OnInit {
  @ViewChild('messageForm') messageForm?: NgForm
  @Input() username?: string;
  @Input() otherUsername?: string;
  @ViewChild('scrollMe', { static: true }) myScrollContainer?: ElementRef;
  messageContent = '';
  loading = false;
  messages: Message[] = [];
  user?: any;
  member: Member = {} as Member;

  constructor(public messageService: MessageService, private accountService: AccountService,
    public presenceService: PresenceService, private route: ActivatedRoute) {
    this.accountService.currentUser$.pipe(take(1)).subscribe({
      next: user => {
        if (user) this.user = user;
      }
    });
  }

  ngOnInit(): void {
    this.route.data.subscribe({
      next: data => this.member = data['member']
    })
    if (this.username == this.user.username) {
      this.username = this.otherUsername;
    }
    this.messageService.messageThread$.subscribe(messages => {
      this.messages = messages;
      this.markMessagesAsRead();
    });
    if (this.messageService.started == false) {
      this.messageService.createHubConnection(this.user, this.username!);
    }
  }

  ngOnDestroy(): void {
    this.messageService.started = false;
    this.presenceService.removeMessageViewer(this.user.username);
    this.messageService.stopHubConnection();
  }

  ngAfterViewChecked(): void {
    //Called after every check of the component's view. Applies to components only.
    //Add 'implements AfterViewChecked' to the class.
    this.scrollToBottom();
  }

  scrollToBottom(): void {
    try {
      this.myScrollContainer!.nativeElement.scrollTop = this.myScrollContainer!.nativeElement.scrollHeight;
    } catch (err) { }
  }

  private async markMessagesAsRead() {
    // use for..of loop to handle async operations
    for (let message of this.messages) {
      if (message.recipientUsername == this.user.username && message.dateRead == null) {
        // await the completion of markAsRead before continuing
        await this.messageService.markAsRead(message.id);
        this.messageForm?.reset();
      }
    }
  }

  sendMessage() {
    if (!this.username) return;
    this.loading = true;
    this.messageService.sendMessage(this.username, this.messageContent).then(() => {
      this.messageForm?.reset();
    }).finally(() => this.loading = false);
    this.messageService.messageThread$.subscribe(messages => {
      this.messages = messages;
      this.markMessagesAsRead();//check the last message sent by this guy
      this.messageService.getLastMessageOfUser(this.user.id).subscribe({
        next: message => {
          if (message.dateRead != null && message.senderUsername == this.user.username && message.recipientUsername == this.username) {
            this.messages[this.messages.length - 1].dateRead = message.dateRead;
            this.messageForm?.reset();
          }
        }
      });
    });
    this.messageForm?.reset();
  }
}
