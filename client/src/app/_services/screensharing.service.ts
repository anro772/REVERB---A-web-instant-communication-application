import { Injectable } from '@angular/core';
import { HubConnection, HubConnectionBuilder } from '@microsoft/signalr';
import * as signalR from '@microsoft/signalr';
import { User } from '../_models/user';
import { environment } from 'src/environments/environment';
import { BusyService } from './busy.service';

@Injectable({
    providedIn: 'root'
})
export class ScreenSharingService {
    public hubConnection!: signalR.HubConnection;

    constructor() { }

    createHubConnection(
        user: User,
        roomId: string,
        handleScreenOffer: (sender: number, offer: string) => void,
        handleScreenAnswer: (sender: number, answer: string) => void,
        handleIceCandidate: (sender: number, candidate: string) => void,
        handleScreenSharingEnded: (sender: number) => void,
        closeRemoteScreen: (sender: number) => void
        //handleVideoStatus: (sender: number, status: boolean) => void
    ): void {
        this.hubConnection = new signalR.HubConnectionBuilder()
            .withUrl(environment.hubUrl + 'screensharing', {
                accessTokenFactory: () => user.token
            })
            .withAutomaticReconnect()
            .build()

        this.hubConnection
            .start()
            .then(() => console.log('Connection started for Screen Sharing'))
            .catch(error => console.log(error));

        this.hubConnection.on('ReceiveScreenOffer', handleScreenOffer);
        this.hubConnection.on('ReceiveScreenAnswer', handleScreenAnswer);
        this.hubConnection.on('ReceiveIceCandidate', handleIceCandidate);
        this.hubConnection.on('ReceiveScreenSharingEnded', handleScreenSharingEnded);  // <-- add this line
        // this.hubConnection.on('ScreenSharingEnded', handleScreenSharingEnded);  // <-- add this line
        this.hubConnection.on('StopScreenSharing', closeRemoteScreen);  // <-- add this line

        this.hubConnection.on('Connected', () => {
            this.joinRoom(roomId);
        });
    }

    async stopScreenSharing(targetUser: number): Promise<void> {
        return this.hubConnection.invoke('StopScreenSharing', targetUser)
            .catch(error => console.log(error));
    }

    async sendScreenSharingEnded(targetUser: number): Promise<void> {
        return this.hubConnection.invoke('SendScreenSharingEnded', targetUser)
            .catch(error => console.log(error));
    }

    async sendScreenOffer(targetUser: number, offer: string): Promise<void> {
        return this.hubConnection.invoke('SendScreenOffer', targetUser, offer)
            .catch(error => console.log(error));
    }

    async sendScreenAnswer(targetUser: number, answer: string): Promise<void> {
        return this.hubConnection.invoke('SendScreenAnswer', targetUser, answer)
            .catch(error => console.log(error));
    }

    async sendIceCandidate(targetUser: number, candidate: string): Promise<void> {
        return this.hubConnection.invoke('SendIceCandidate', targetUser, candidate)
            .catch(error => console.log(error));
    }

    async joinRoom(roomId: string): Promise<void> {
        return this.hubConnection.invoke('JoinRoom', roomId)
            .catch(error => console.log(error));
    }

    stopHubConnection(): void {
        this.hubConnection.stop().catch(error => console.log(error));
    }

    getRoomId(userId: number): string {
        // Replace this with your actual logic for getting roomId
        return userId.toString();
    }

    createRoom(userId1: number, userId2: number): string {
        // Create a unique identifier for a room between two users
        let userIds = [userId1, userId2].sort();
        return userIds.join('-');
    }


}