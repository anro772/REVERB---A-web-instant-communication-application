import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { map, of, take } from 'rxjs';
import { environment } from 'src/environments/environment';
import { Member } from '../_models/member';
import { User } from '../_models/user';
import { UserParams } from '../_models/userParams';
import { AccountService } from './account.service';
import { getPaginatedResult, getPaginationHeaders } from './paginationHelper';
import { FriendRequest } from '../_models/friendrequest';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class MembersService {
  baseUrl = environment.apiUrl;
  members: Member[] = [];
  memberCache = new Map();
  user: User | undefined;
  userParams: UserParams | undefined;

  constructor(private http: HttpClient, private accountService: AccountService) {
    this.accountService.currentUser$.pipe(take(1)).subscribe(user => {
      if (user) {
        this.userParams = new UserParams(user);
        console.log(this.userParams)
        this.user = user;

      }
    });
    // Subscribe to logout events
    this.accountService.logoutEvent.subscribe(logout => {
      if (logout) {
        this.memberCache.clear();
      }
    });
  }

  ngOnInit(): void {
    //Called after the constructor, initializing input properties, and the first call to ngOnChanges.
    //Add 'implements OnInit' to the class.

  }

  getCurrentUser(): User | undefined {
    return this.user;
  }


  getUserParams() {
    return this.userParams;
  }

  setUserParams(params: UserParams) {
    this.userParams = params;
  }

  resetUserParams() {
    if (this.user) {
      this.userParams = new UserParams(this.user);
      return this.userParams;
    }
    return;
  }

  getMembers(userParams: UserParams) {
    const response = this.memberCache.get(Object.values(userParams).join('-'));

    if (response) return of(response);

    let params = getPaginationHeaders(userParams.pageNumber, userParams.pageSize);

    params = params.append('minAge', userParams.minAge);
    params = params.append('maxAge', userParams.maxAge);
    params = params.append('orderBy', userParams.orderBy);

    return getPaginatedResult<Member[]>(this.baseUrl + 'users', params, this.http).pipe(
      map(response => {
        this.memberCache.set(Object.values(userParams).join('-'), response);
        return response;
      })
    )
  }

  getUsername(userId: number) {
    return this.http.get<string>(this.baseUrl + 'users/getusername/' + userId, { responseType: 'text' as 'json' });
  }

  getUserById(id: number) {
    return this.http.get<Member>(this.baseUrl + 'users/getuser/' + id);
  }

  getMember(username: string) {
    const member = [...this.memberCache.values()]
      .reduce((arr, elem) => arr.concat(elem.result), [])
      .find((member: Member) => member.userName === username);

    if (member) return of(member);

    return this.http.get<Member>(this.baseUrl + 'users/' + username);
  }

  updateMember(member: Member) {
    return this.http.put(this.baseUrl + 'users', member).pipe(
      map(() => {
        const index = this.members.indexOf(member);
        this.members[index] = { ...this.members[index], ...member }
      })
    )
  }

  deletePhoto(photoId: number) {
    return this.http.delete(this.baseUrl + 'users/delete-photo/' + photoId);
  }

  updatePhoto(photo: File) {
    const formData: FormData = new FormData();
    formData.append('file', photo);
    return this.http.post(this.baseUrl + 'users/add-photo', formData);
  }

  getFriends(userId: number) {
    return this.http.get<Member[]>(this.baseUrl + 'friendrequest/' + userId + '/friends');
  }

  sendFriendRequest(username: string): Observable<string> {
    return this.http.post(this.baseUrl + 'FriendRequest/' + username, {}, { responseType: 'text' });
  }

  getFriendRequests(userId: number) {
    return this.http.get<FriendRequest[]>(this.baseUrl + 'friendrequest/' + userId + '/friend-requests');
  }

  acceptFriendRequest(friendRequestId: number) {
    return this.http.put(this.baseUrl + 'friendrequest/accept-request/' + friendRequestId, {}, { responseType: 'text' });
  }

  declineFriendRequest(friendRequestId: number) {
    return this.http.put(this.baseUrl + 'friendrequest/decline-request/' + friendRequestId, {}, { responseType: 'text' });
  }

  areFriends(userId: number, memberId: number): Observable<boolean> {
    return this.http.get<User[]>(this.baseUrl + `FriendRequest/${userId}/friends`).pipe(
      map(friends => {
        for (let friend of friends) {
          if (friend.id === memberId) {
            return true;
          }
        }
        return false;
      })
    );
  }

  searchUsersByName(name: string): Observable<Member[]> {
    return this.http.get<Member[]>(this.baseUrl + 'users/search/' + name);
  }

  getFriendsForUser(userId: number): Observable<Member[]> {
    return this.http.get<Member[]>(this.baseUrl + 'friendrequest/' + userId + '/friends');
  }
}
