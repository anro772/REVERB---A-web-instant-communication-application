import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { environment } from 'src/environments/environment';
import { Group } from '../_models/group';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { User } from '../_models/user';
import { UserGroup } from '../_models/usergroup';
import { GroupWithMembers } from '../_models/groupwithmembers';
import { Member } from '../_models/member';
import { map, take } from 'rxjs/operators';
import { Message } from '../_models/message';
import { HttpTransportType, HubConnection, HubConnectionBuilder } from '@microsoft/signalr';

@Injectable({
  providedIn: 'root'
})
export class GroupService {
  baseUrl = environment.apiUrl;
  hubUrl = environment.hubUrl;
  private hubConnection?: HubConnection;
  private currentGroupSource = new BehaviorSubject<Group | null>(null);
  private currentGroupSubject = new BehaviorSubject<Group | null>(null);
  currentGroup$: Observable<Group | null> = this.currentGroupSubject.asObservable();
  private groupMessagesSource = new BehaviorSubject<Message[]>([]);
  groupMessages$ = this.groupMessagesSource.asObservable();

  constructor(private http: HttpClient) { }

  createHubConnection(user: User, groupId: string) {
    this.hubConnection = new HubConnectionBuilder()
      .withUrl(this.hubUrl + 'groupmessage?groupId=' + groupId, {
        accessTokenFactory: () => user.token,
        transport: HttpTransportType.WebSockets
      })
      .withAutomaticReconnect()
      .build();

    this.hubConnection.start()
      .catch(error => console.log(error));

    this.hubConnection.on('ReceiveGroupMessageThread', messages => {
      this.groupMessagesSource.next(messages);
    });

    this.hubConnection.on('NewGroupMessage', message => {
      this.groupMessages$.pipe(take(1)).subscribe(messages => {
        this.groupMessagesSource.next([...messages, message]);
      })
    });
  }

  stopHubConnection() {
    if (this.hubConnection) {
      this.hubConnection.stop();
    }
  }

  async sendGroupMessageInvoke(groupId: number, content: string, senderUsername:string) {
    return this.hubConnection!.invoke('SendMessageToGroup', { groupId, content, senderUsername })
      .catch(error => console.log(error));
  }
  
  getGroupMessages(groupId: number): Observable<Message[]> {
    const url = this.baseUrl + 'messages/group/' + groupId;
    return this.http.get<Message[]>(url);
  }

  setCurrentGroup(group: Group) {
    this.currentGroupSubject.next(group);
  }

  createGroup(groupName: string, photo: File): Observable<Group> {
    const formData: FormData = new FormData();
    formData.append('Name', groupName);
    formData.append('Photo', photo);

    return this.http.post<Group>(this.baseUrl + 'group/create', formData);
  }

  deleteGroup(groupName: string): Observable<Group> {
    return this.http.delete<Group>(this.baseUrl + 'group/delete/' + groupName);
  }

  getGroupById(groupId: number): Observable<Group> {
    return this.http.get<Group>(this.baseUrl + 'group/' + groupId);
  }

  getGroupMembers(groupId: number) {
    return this.http.get<User[]>(this.baseUrl + 'usergroup/members' + groupId);
  }

  inviteUserToGroup(userId: number, groupId: number) {
    return this.http.post(this.baseUrl + 'usergroup/invite', { userId, groupId }, { responseType: 'text' });
  }

  getGroups(): Observable<Group[]> {
    return this.http.get<Group[]>(this.baseUrl + 'group/groups');
  }

  getUserGroups(): Observable<UserGroup[]> {
    return this.http.get<UserGroup[]>(this.baseUrl + 'usergroup/usergroups');
  }

  getMembersForGroup(groupId: number): Observable<Member[]> {
    return this.http.get<Member[]>(this.baseUrl + 'usergroup/members/' + groupId);
  }

  getGroupsForUser(userId: number): Observable<Group[]> {
    return this.http.get<Group[]>(this.baseUrl + 'group/groups/' + userId);
  }

  getUserGroupsForUser(userId: number): Observable<GroupWithMembers[]> {
    return this.http.get<GroupWithMembers[]>(this.baseUrl + 'usergroup/usergroups/' + userId);
  }

  getUserGroupsForUserAccepted(userId: number): Observable<UserGroup[]> {
    return this.http.get<UserGroup[]>(this.baseUrl + 'usergroup/usergroups-accepted/' + userId);
  }

  acceptInvite(groupId: number) {
    return this.http.post(this.baseUrl + 'usergroup/accept-invitation', { groupId }, { responseType: 'text' });
  }

  acceptUserGroupInvitation(groupId: number) {
    return this.http.post(this.baseUrl + 'usergroup/accept-invitation', { groupId }, { responseType: 'text' });
  }

  declineUserGroupInvitation(groupId: number) {
    return this.http.post(this.baseUrl + 'usergroup/decline-invitation', { groupId }, { responseType: 'text' });
  }

  getGroupInvitations(userId: number): Observable<UserGroup[]> {
    return this.http.get<UserGroup[]>(this.baseUrl + 'usergroup/invitations/' + userId);
  }

  sendGroupMessage(groupId: number, content: string) {
    return this.http.post<Message>(this.baseUrl + 'messages/group/' + groupId, { content }).pipe(
      map((message: Message) => {
        const currentMessages = this.groupMessagesSource.value;
        this.groupMessagesSource.next([...currentMessages, message]);
      })
    );
  }
}
