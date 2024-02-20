import { Component, ElementRef, OnInit, OnDestroy, ViewChild } from '@angular/core';
import { VideoChatService } from '../_services/videochat.service';
import { AccountService } from '../_services/account.service';
import { ActivatedRoute } from '@angular/router';
import { take } from 'rxjs/operators';
import { MembersService } from '../_services/members.service';
import { MessageService } from '../_services/message.service';
import { MemberMessagesComponent } from '../members/member-messages/member-messages.component';
import { Subject, BehaviorSubject } from 'rxjs';
import { User } from '../_models/user';
import { Member } from '../_models/member';
import { ScreenSharingService } from '../_services/screensharing.service';

//get token from local storage key=user


@Component({
  selector: 'app-video-chat',
  templateUrl: './video-chat.component.html',
  styleUrls: ['./video-chat.component.css']
})

export class VideoChatComponent implements OnInit {
  @ViewChild('localVideo', { static: true }) localVideo!: ElementRef;
  @ViewChild('remoteVideo', { static: true }) remoteVideo!: ElementRef;
  @ViewChild('noLocalVideo', { static: true }) noLocalVideo!: any;
  @ViewChild('screenVideo', { static: true }) screenVideo!: ElementRef; // Add this line for screen sharing video element

  peerConnection!: RTCPeerConnection;
  localStream!: MediaStream;
  remoteStream!: MediaStream;
  localUsername!: string;
  roomId!: string;
  localId!: number;
  remoteId!: number;
  roomNameLocal!: number;
  roomNameRemote!: number;
  roomNameLocalString!: string;
  roomNameRemoteSubject: Subject<string> = new BehaviorSubject<string>('');
  roomNameRemoteString!: string;
  roomNameLocalSubject: Subject<string> = new BehaviorSubject<string>('');
  remoteVideoAvailable: boolean = false;
  user?: any;
  localVideoEnabled: BehaviorSubject<boolean> = new BehaviorSubject(true);
  localVideoAvailable: boolean = true;
  otherUser?: Member;
  screenPeerConnection: RTCPeerConnection | null = null; // Add this line for screen sharing peer connection
  screenStream!: MediaStream | null; // Add this line for screen sharing stream
  screenVideoAvailable: boolean = false; // Add this line for screen sharing video availability
  screenVideoAvailableTriggered: boolean = false; // Add this line for screen sharing video availability

  constructor(
    private videoChatService: VideoChatService,
    private accountService: AccountService,
    private route: ActivatedRoute,
    private membersService: MembersService,
    private screenSharingService: ScreenSharingService
  ) { }

  async handleScreenSharingEnded() {
    console.log("Screen sharing ended.");
    this.screenVideoAvailable = false;
    this.screenVideo.nativeElement.srcObject = null;
    this.screenVideo.nativeElement.style.display = 'none'; // Or use a class to hide
    //this.screenSharingService.stopScreenSharing(this.remoteId); // replace this.remoteId with the id of the other user
    this.stopScreenSharing();
    //this.screenSharingService.stopScreenSharing(this.localId)
    //reload the page
    window.location.reload();
  }

  async closeRemoteScreen() {
    console.log("Closing remote screen.");
    this.screenVideoAvailable = false;
    this.screenVideo.nativeElement.srcObject = null;
    this.screenVideo.nativeElement.style.display = 'none'; // Or use a class to hide
    window.location.reload();
  }

  ngOnInit(): void {
    this.remoteStream = new MediaStream();
    //console.log("Initialized remote media stream...");

    // Get roomId from the route
    this.route.params.subscribe(params => {
      this.roomId = params['roomId'];

      this.roomNameLocal = parseInt(this.roomId.split('-')[0]);
      this.roomNameRemote = parseInt(this.roomId.split('-')[1]);


      this.membersService.getUsername(this.roomNameLocal).subscribe(username => {
        this.roomNameLocalSubject.next(username);
        this.roomNameLocalString = username;
      });

      this.membersService.getUsername(this.roomNameRemote).subscribe(username => {
        this.roomNameRemoteSubject.next(username);
        this.roomNameRemoteString = username;
        // console.log(this.roomNameRemote);
        this.membersService.getUserById(this.roomNameRemote).subscribe(user => {
          this.otherUser = user;
          //console.log('other user: ' + user.photoUrl)
        }
        );
      });

    });

    this.accountService.currentUser$.pipe(take(1)).subscribe(user => {
      if (user) {
        this.localId = user.id;

        this.videoChatService.createHubConnection(
          user,
          this.roomId!,
          this.handleOffer.bind(this),
          this.handleAnswer.bind(this),
          this.handleIceCandidate.bind(this),
          this.handleVideoStatus.bind(this)
        );
        this.screenSharingService.createHubConnection(
          user,
          this.roomId!,
          this.handleScreenOffer.bind(this),
          this.handleScreenAnswer.bind(this),
          this.handleScreenIceCandidate.bind(this),
          this.handleScreenSharingEnded.bind(this),
          this.closeRemoteScreen.bind(this)
        );
      }
    });

    this.peerConnection = new RTCPeerConnection({
      iceServers: [
        {
          urls: 'stun:stun2.l.google.com:19302',
        },
        {
          urls: 'turn:numb.viagenie.ca',
          username: 'webrtc@live.com',
          credential: 'muazkh'
        },
        {
          urls: 'turn:192.158.29.39:3478?transport=udp',
          username: '28224511:1379330808',
          credential: 'JZEOEt2V3Qb0y27GRntt2u2PAYA='
        }
      ],
    });

    this.screenPeerConnection = new RTCPeerConnection({
      iceServers: [
        {
          urls: 'stun:stun2.l.google.com:19302',
        },
        {
          urls: 'turn:numb.viagenie.ca',
          username: 'webrtc@live.com',
          credential: 'muazkh'
        },
        {
          urls: 'turn:192.158.29.39:3478?transport=udp',
          username: '28224511:1379330808',
          credential: 'JZEOEt2V3Qb0y27GRntt2u2PAYA='
        }
      ],
    });

    this.peerConnection.ontrack = (event) => {
      // console.log("Received remote track. Adding to remote stream...");
      event.streams[0].getTracks().forEach(track => {
        this.remoteStream.addTrack(track);
      });

      if (this.remoteVideo && this.remoteVideo.nativeElement) {
        this.remoteVideo.nativeElement.srcObject = this.remoteStream;
        this.remoteVideoAvailable = true;
        this.remoteVideo.nativeElement.play();
        //console.log('Attached remote stream to video element.');
      } else {
        //console.error('Remote video is undefined.');
      }
    };

    this.peerConnection.onconnectionstatechange = (event) => {
      if (this.peerConnection.connectionState === 'disconnected' ||
        this.peerConnection.connectionState === 'failed' ||
        this.peerConnection.connectionState === 'closed') {
        //console.log("PeerConnection disconnected/failed/closed. Displaying fallback image...");
        this.remoteVideoAvailable = false;

        if (this.remoteVideoAvailable == false) {
          this.remoteVideo.nativeElement.srcObject = null;
        }
      }
    };

    this.screenPeerConnection.onconnectionstatechange = (event) => {
      if (this.screenPeerConnection!.connectionState === 'disconnected' ||
        this.screenPeerConnection!.connectionState === 'failed' ||
        this.screenPeerConnection!.connectionState === 'closed') {
        this.screenSharingService.stopScreenSharing(this.remoteId); // replace this.remoteId with the id of the other user
        console.log('called onconnectionstatechange')
        console.log("Screen sharing PeerConnection disconnected/failed/closed. Displaying fallback image...");
        this.screenVideoAvailable = false;
        if (this.screenVideoAvailable == false) {
          this.screenVideo.nativeElement.srcObject = null;
          this.screenVideo.nativeElement.style.display = 'none'; // Or use a class to hide
          window.location.reload();
        }
      }
    };

    this.peerConnection.onnegotiationneeded = async () => {
      // console.log("Negotiation needed. Creating and setting local offer...");
      const offer = await this.peerConnection.createOffer();
      await this.peerConnection.setLocalDescription(offer);
      //console.log("Local offer created and set. Sending to other peer...");

      this.remoteId = parseInt(this.roomId.split('-').filter(id => id !== this.localId.toString())[0]);

      this.videoChatService.sendOffer(this.remoteId, JSON.stringify(offer));
    };

    this.peerConnection.onicecandidate = (event) => {
      if (event.candidate) {
        // console.log("New ICE candidate created. Sending to other peer...");
        this.remoteId = parseInt(this.roomId.split('-').filter(id => id !== this.localId.toString())[0]);
        this.videoChatService.sendIceCandidate(this.remoteId, JSON.stringify(event.candidate));
      } else {
        //console.log("ICE candidate gathering completed.");
      }
    };

    this.screenStream = new MediaStream();

    this.screenPeerConnection.ontrack = (event) => {
      console.log("Received screen sharing track. Adding to screen stream...");
      //empty the screen stream
      this.screenStream = new MediaStream();

      event.streams[0].getTracks().forEach(track => {
        this.screenStream?.addTrack(track);


        track.onended = () => {
          console.log("Screen sharing track ended.");
          this.screenVideoAvailable = false;
          this.screenVideo.nativeElement.srcObject = null;
          this.screenVideo.nativeElement.style.display = 'none'; // Or use a class to hide
          window.location.reload();

          this.stopScreenSharing();
          console.log('called ontrack')
        };

      });

      this.screenVideo.nativeElement.srcObject = this.screenStream;
      this.screenVideoAvailable = true;
      this.screenVideo.nativeElement.play();
      this.screenVideo.nativeElement.style.display = 'block'; // Or use a class to show
    };

    this.screenPeerConnection.onnegotiationneeded = async () => {
      console.log("Negotiation needed for screen sharing. Creating and setting local offer...");
      const offer = await this.screenPeerConnection!.createOffer();
      await this.screenPeerConnection!.setLocalDescription(offer);
      console.log("Local offer for screen sharing created and set. Sending to other peer...");

      this.remoteId = parseInt(this.roomId.split('-').filter(id => id !== this.localId.toString())[0]);

      this.screenSharingService.sendScreenOffer(this.remoteId, JSON.stringify(offer));
    };

    this.screenPeerConnection.onicecandidate = (event) => {
      if (event.candidate) {
        console.log("New ICE candidate for screen sharing created. Sending to other peer...");
        this.remoteId = parseInt(this.roomId.split('-').filter(id => id !== this.localId.toString())[0]);
        this.screenSharingService.sendIceCandidate(this.remoteId, JSON.stringify(event.candidate));
      } else {
        console.log("ICE candidate gathering for screen sharing completed.");
      }
    };


    navigator.mediaDevices.getUserMedia({ video: true, audio: true })
      .then(stream => {
        //console.log("Received local media stream. Adding tracks to peer connection...");
        this.localStream = stream;
        this.localVideo.nativeElement.volume = 0;
        this.localVideo.nativeElement.srcObject = this.localStream;
        // console.log('Attached local stream to video element.');
        stream.getTracks().forEach(track => {
          this.peerConnection.addTrack(track, stream);
        });
        // console.log("Added local stream tracks to peer connection.");
      })
      .catch(err => {
        // console.log("An error occurred while accessing the media devices:", err);
      });
  }

  async initLocalVideo(): Promise<void> {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });

      // console.log("Received local media stream. Adding tracks to peer connection...");
      this.localStream = stream;

      setTimeout(() => {
        this.localVideo.nativeElement.volume = 0;
        this.localVideo.nativeElement.srcObject = this.localStream;
        // console.log('Attached local stream to video element.');
      }, 0);

      stream.getTracks().forEach(track => {
        this.peerConnection.addTrack(track, stream);
      });
      //console.log("Added local stream tracks to peer connection.");
    } catch (err) {
      // console.log("An error occurred while accessing the media devices:", err);
    }
  }

  ngAfterViewInit(): void {
    //Called after ngAfterContentInit when the component's view has been initialized. Applies to components only.
    //Add 'implements AfterViewInit' to the class.
    //this.initLocalVideo();
  }

  //END OF NGONINIT----------------------------------------------------------

  showScreenSharing(): void {
    if (this.screenVideoAvailable) {
      this.screenVideo.nativeElement.srcObject = this.screenStream;
      this.screenVideo.nativeElement.style.display = 'block'; // Or use a class to show
      this.screenVideo.nativeElement.play();
    } else {
      console.log('No active screen sharing to show.');
      window.location.reload();

    }
  }


  async startScreenSharing2(): Promise<void> {
    if (this.screenVideoAvailable) {
      console.log('Screen sharing is already started.');
      return;
    }

    try {
      console.log('Starting screen sharing...');
      // Request the screen stream
      this.screenStream = await navigator.mediaDevices.getDisplayMedia({ video: true });

      // Reset the PeerConnection
      this.screenPeerConnection = new RTCPeerConnection({
        iceServers: [
          {
            urls: 'stun:stun2.l.google.com:19302',
          },
          {
            urls: 'turn:numb.viagenie.ca',
            username: 'webrtc@live.com',
            credential: 'muazkh'
          },
          {
            urls: 'turn:192.158.29.39:3478?transport=udp',
            username: '28224511:1379330808',
            credential: 'JZEOEt2V3Qb0y27GRntt2u2PAYA='
          }
        ]
      });

      // For each track in the screen stream, add the track to the connection
      this.screenStream.getTracks().forEach(track => {
        this.screenPeerConnection!.addTrack(track, this.screenStream!);
      });

      // Add icecandidate event handler
      this.screenPeerConnection.onicecandidate = (event) => {
        if (event.candidate) {
          console.log('Got screen ICE candidate from STUN/TURN server:', event.candidate);
          this.screenSharingService.sendIceCandidate(this.remoteId, JSON.stringify(event.candidate));
        } else {
          console.log('Screen ICE negotiation with STUN/TURN server complete');
        }
      };

      // Create offer
      const offer = await this.screenPeerConnection.createOffer();
      console.log('Setting local description with screen sharing offer...');
      await this.screenPeerConnection.setLocalDescription(offer);

      console.log('Sending screen sharing offer to other peer...');
      this.screenSharingService.sendScreenOffer(this.remoteId, JSON.stringify(offer));
      this.screenVideoAvailable = true;

      // Display the local stream
      this.screenVideo.nativeElement.srcObject = this.screenStream;
      this.screenVideo.nativeElement.style.display = 'block'; // Or use a class to show
    } catch (error) {
      console.log('Failed to start screen sharing:', error);
    }
  }

  handleVideoStatus(sender: number, status: boolean): void {
    //console.log(`User ${sender} has turned his video ${status ? 'on' : 'off'}`);
    if (sender !== this.localId) {
      this.remoteVideoAvailable = status;
    } else {
      //this.localVideoEnabled = new BehaviorSubject(status);
      //this.localVideoAvailable = status;
    }
  }

  async stopScreenSharing(): Promise<void> {
    if (!this.screenVideoAvailable) {
      console.log('Screen sharing is not started.');
      return;
    }

    try {
      console.log('Stopping screen sharing...');

      // Stop all tracks
      this.screenStream?.getTracks().forEach(track => {
        track.onended = null; // Remove the event handler
        track.stop();
      });

      // Close the PeerConnection
      if (this.screenPeerConnection) {
        this.screenPeerConnection.close();
        this.screenPeerConnection = null;
      }

      // Nullify the stream
      this.screenStream = null;

      // Notify the other peer that screen sharing has stopped
      this.screenSharingService.stopScreenSharing(this.remoteId);
      console.log('called stopscreensharing')

      // Clear the video element
      this.screenVideo.nativeElement.srcObject = null;
      this.screenVideo.nativeElement.style.display = 'none'; // Or use a class to hide

      this.screenVideoAvailable = false;
      window.location.reload();

    } catch (error) {
      console.log('Failed to stop screen sharing:', error);
    }
  }



  async handleOffer(sender: number, offer: string) { // sender is now number
    // console.log("Handling received offer from", sender);
    if (sender === this.localId) {
      // console.log("Received offer from self, ignoring...");
      return;
    }
    // console.log("Setting remote description...");
    await this.peerConnection.setRemoteDescription(new RTCSessionDescription(JSON.parse(offer)));

    //console.log("Creating local answer...");
    const answer = await this.peerConnection.createAnswer();
    //console.log("Setting local description with answer...");
    await this.peerConnection.setLocalDescription(answer);

    //console.log("Sending local answer to other peer...");
    this.videoChatService.sendAnswer(sender, JSON.stringify(answer));
  }

  async handleScreenOffer(sender: number, offer: string) { // sender is now number
    console.log("Handling received screen sharing offer from", sender);
    if (sender === this.localId) {
      console.log("Received screen sharing offer from self, ignoring...");
      return;
    }
    console.log("Setting remote description for screen sharing...");
    await this.screenPeerConnection!.setRemoteDescription(new RTCSessionDescription(JSON.parse(offer)));

    console.log("Creating local answer for screen sharing...");
    const answer = await this.screenPeerConnection!.createAnswer();
    console.log("Setting local description with answer for screen sharing...");
    await this.screenPeerConnection!.setLocalDescription(answer);

    console.log("Sending local answer for screen sharing to other peer...");
    this.screenSharingService.sendScreenAnswer(sender, JSON.stringify(answer));
  }

  async handleScreenAnswer(sender: number, answer: string) { // sender is now number
    console.log("Handling received screen sharing answer from", sender);
    if (sender === this.localId) {
      console.log("Received screen sharing answer from self, ignoring...");
      return;
    }
    console.log("Setting remote description for screen sharing...");
    await this.screenPeerConnection!.setRemoteDescription(new RTCSessionDescription(JSON.parse(answer)));
  }

  async handleAnswer(sender: number, answer: string) { // sender is now number
    //console.log("Handling received answer from", sender);
    if (sender === this.localId) {
      // console.log("Received answer from self, ignoring...");
      return;
    }
    //console.log("Setting remote description with answer...");
    await this.peerConnection.setRemoteDescription(new RTCSessionDescription(JSON.parse(answer)));
  }

  async handleIceCandidate(sender: number, candidate: string) { // sender is now number
    // console.log("Handling received ICE candidate from", sender);
    if (sender === this.localId) {
      // console.log("Received ICE candidate from self, ignoring...");
      return;
    }
    //console.log("Adding received ICE candidate...");
    await this.peerConnection.addIceCandidate(new RTCIceCandidate(JSON.parse(candidate)));
  }

  async handleScreenIceCandidate(sender: number, candidate: string) { // sender is now number
    console.log("Handling received ICE candidate for screen sharing from", sender);
    if (sender === this.localId) {
      console.log("Received ICE candidate for screen sharing from self, ignoring...");
      return;
    }
    console.log("Adding received ICE candidate for screen sharing...");
    await this.screenPeerConnection!.addIceCandidate(new RTCIceCandidate(JSON.parse(candidate)));
  }

  ngOnDestroy(): void {
    console.log("Video chat component is being destroyed. Stopping local tracks...");

    this.localStream.getTracks().forEach(track => {
      track.stop();
      track.enabled = false;
    });
    this.remoteVideoAvailable = false;
    this.screenVideoAvailable = false;

    this.stopScreenSharing();
    console.log('called ondestroy')
    this.screenSharingService.stopHubConnection();
    this.videoChatService.stopHubConnection();

    // Optionally, you may want to clean up the peerConnection as well
    this.peerConnection.close();
    this.screenPeerConnection!.close();
  }

  toggleLocalVideo(): void {
    this.localVideoEnabled.next(!this.localVideoEnabled.value);
    this.localVideoAvailable = this.localVideoEnabled.value;
    this.localStream.getVideoTracks()[0].enabled = this.localVideoEnabled.value;
  }

  setVolume(value: string): void {
    const volume = parseFloat(value);
    if (this.remoteVideo && this.remoteVideo.nativeElement) {
      this.remoteVideo.nativeElement.volume = volume;
    }
  }
}
