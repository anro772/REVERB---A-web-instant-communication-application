import { Injectable } from '@angular/core';
import { HubConnection, HubConnectionBuilder } from '@microsoft/signalr';
import * as signalR from '@microsoft/signalr';
import { User } from '../_models/user';
import { environment } from 'src/environments/environment';
import { BusyService } from './busy.service';

@Injectable({
    providedIn: 'root'
})
export class VideoChatService {
    private hubConnection!: signalR.HubConnection;

    constructor() { }

    createHubConnection(
        user: User,
        roomId: string,
        handleOffer: (sender: number, offer: string) => void, // sender is now number
        handleAnswer: (sender: number, answer: string) => void, // sender is now number
        handleIceCandidate: (sender: number, candidate: string) => void, // sender is now number
        handleVideoStatus: (sender: number, status: boolean) => void // sender is now number
    ): void {
        this.hubConnection = new signalR.HubConnectionBuilder()
            .withUrl(environment.hubUrl + 'videoChat', {
                accessTokenFactory: () => user.token
            })
            .withAutomaticReconnect()
            .build()

        this.hubConnection
            .start()
            .then(() => console.log('Connection started for Video Chat'))
            .catch(error => console.log(error));

        this.hubConnection.on('ReceiveOffer', handleOffer);
        this.hubConnection.on('ReceiveAnswer', handleAnswer);
        this.hubConnection.on('ReceiveIceCandidate', handleIceCandidate);
        this.hubConnection.on('ReceiveVideoStatus', handleVideoStatus); // Listening to VideoStatus

        this.hubConnection.on('Connected', () => {
            this.joinRoom(roomId);
        });
    }

    sendVideoStatus(receiverId: number, status: boolean): Promise<void> {
        return this.hubConnection.invoke('SendVideoStatus', receiverId, status);
    }

    async sendOffer(targetUser: number, offer: string): Promise<void> {
        return this.hubConnection.invoke('SendOffer', targetUser, offer)
            .catch(error => console.log(error));
    }

    async sendAnswer(targetUser: number, answer: string): Promise<void> {
        return this.hubConnection.invoke('SendAnswer', targetUser, answer)
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
