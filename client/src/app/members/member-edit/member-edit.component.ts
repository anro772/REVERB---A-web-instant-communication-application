import { Component, HostListener, OnInit, ViewChild } from '@angular/core';
import { NgForm } from '@angular/forms';
import { ToastrService } from 'ngx-toastr';
import { take } from 'rxjs';
import { Member } from 'src/app/_models/member';
import { User } from 'src/app/_models/user';
import { AccountService } from 'src/app/_services/account.service';
import { MembersService } from 'src/app/_services/members.service';
import {
  HttpEvent,
  HttpEventType,
  HttpResponse,
} from '@angular/common/http';
import { Observable } from 'rxjs';

@Component({
  selector: 'app-member-edit',
  templateUrl: './member-edit.component.html',
  styleUrls: ['./member-edit.component.css']
})
export class MemberEditComponent implements OnInit {
  @ViewChild('editForm') editForm: NgForm | undefined;
  @HostListener('window:beforeunload', ['$event']) unloadNotification($event: any) {
    if (this.editForm?.dirty) {
      $event.returnValue = true;
    }
  }
  member: Member | undefined;
  user: User | null = null;
  photo: File | null = null;
  photoSelected: boolean = false;

  constructor(private accountService: AccountService, private memberService: MembersService,
    private toastr: ToastrService) {
    this.accountService.currentUser$.pipe(take(1)).subscribe({
      next: user => this.user = user
    })
  }

  ngOnInit(): void {
    this.loadMember();
  }

  onPhotoSelect(event: Event) {
    const file = (event.target as HTMLInputElement).files![0];
    this.photo = file;
    this.photoSelected = true;
  }

  uploadPhoto() {
    if (this.photo) {
      this.memberService.updatePhoto(this.photo).subscribe({
        next: _ => {
          this.toastr.success('Photo updated successfully');
          this.photoSelected = false;
        },
        error: err => {
          this.toastr.error('Failed to update photo');
        }
      })
    }
  }

  loadMember() {
    if (!this.user) return;
    this.memberService.getMember(this.user.username).subscribe({
      next: member => this.member = member
    })
  }

  updateMember() {
    this.memberService.updateMember(this.editForm?.value).subscribe({
      next: _ => {
        this.toastr.success('Profile updated successfully');
        this.editForm?.reset(this.member);
      }
    })
  }

  updatePhoto() {
    if (this.photo) {
      this.memberService.updatePhoto(this.photo).subscribe({
        next: (response: any) => { // response contains the new photo details
          this.toastr.success('Photo updated successfully');
          this.accountService.currentUser$.pipe(take(1)).subscribe({
            next: user => {
              if (user) {
                user.photoUrl = response.url; // assuming response contains the new photo url
                this.accountService.setCurrentUser(user);
                this.photoSelected = false;
              }
            }
          });
          window.location.reload();
        },
        error: err => {
          this.toastr.error('Failed to update photo');
        }
      })
    }
  }



}
