import { Component, OnInit } from '@angular/core';
import { AfterViewInit } from '@angular/core';
import { MessageService } from '../_services/message.service';
import { forkJoin } from 'rxjs';
import { Chart } from 'chart.js/auto';
import { MembersService } from '../_services/members.service';

//Chart.register(BarController, CategoryScale, LinearScale);

@Component({
  selector: 'app-stats',
  templateUrl: './stats.component.html',
  styleUrls: ['./stats.component.css']
})
export class StatsComponent implements AfterViewInit {
  chart!: Chart;
  sentMessageCounts: { [key: string]: number } = {};
  receivedMessageCounts: { [key: string]: number } = {};
  private myUsername!: string;
  currentOffset = 0;
  sortedUsernames: string[] = [];
  sortedSentCounts: number[] = [];
  sortedReceivedCounts: number[] = [];

  constructor(private messageService: MessageService, private membersService: MembersService) {
    this.myUsername = this.membersService.getCurrentUser()?.username!;
  }

  scrollChart(direction: number) {
    this.currentOffset += direction * 7; // Change 7 to the number of bars you want to display at a time
    this.currentOffset = Math.max(this.currentOffset, 0); // Prevent scrolling to negative values
    this.updateChart();
  }

  updateChart() {
    // Assuming you have stored the total sorted arrays in `this.sortedUsernames`, `this.sortedSentCounts` and `this.sortedReceivedCounts`
    const displayedUsernames = this.sortedUsernames.slice(this.currentOffset, this.currentOffset + 7);
    const displayedSentCounts = this.sortedSentCounts.slice(this.currentOffset, this.currentOffset + 7);
    const displayedReceivedCounts = this.sortedReceivedCounts.slice(this.currentOffset, this.currentOffset + 7);

    this.chart.data.labels = displayedUsernames;
    this.chart.data.datasets[0].data = displayedSentCounts;
    this.chart.data.datasets[1].data = displayedReceivedCounts;
    this.chart.update();
  }

  processMessages(messages: any[], isSent: boolean) {
    messages.forEach(message => {
      if (message.senderId != message.recipientId && message.groupId === 0) {
        const username = isSent ? message.recipientUsername : message.senderUsername;

        // Ignore the current user's username
        if (username === this.myUsername) {
          return;
        }

        const countMap = isSent ? this.sentMessageCounts : this.receivedMessageCounts;

        if (username in countMap) {
          countMap[username] += 1;
        } else {
          countMap[username] = 1;
        }
      }
    });
  }


  ngAfterViewInit() {

    // Initialize chart
    this.chart = new Chart('canvas', {
      type: 'bar',
      data: {
        labels: [], // Array of usernames
        datasets: [{
          label: 'Messages Sent',
          data: [], // Array of message counts for sent messages
          backgroundColor: 'rgba(75, 192, 192, 0.2)',
          borderColor: 'rgba(75, 192, 192, 1)',
          borderWidth: 1
        },
        {
          label: 'Messages Received',
          data: [], // Array of message counts for received messages
          backgroundColor: 'rgba(255, 206, 86, 0.2)',
          borderColor: 'rgba(255, 206, 86, 1)',
          borderWidth: 1
        }]
      },
      options: {
        responsive: true,
        scales: {
          x: {
            type: 'category',
          },
          y: {
            type: 'linear',
            beginAtZero: true
          }
        }
      }
    });


    // Fetch all user messages
    this.messageService.getAllUserMessages().subscribe(
      messages => {
        this.processMessages(messages, true);  // Process as sent messages
        this.processMessages(messages, false);  // Process as received messages

        // Getting an array of usernames and corresponding counts
        const usernames = Array.from(new Set([...Object.keys(this.sentMessageCounts), ...Object.keys(this.receivedMessageCounts)]));
        const sentCounts = usernames.map(username => this.sentMessageCounts[username] || 0);
        const receivedCounts = usernames.map(username => this.receivedMessageCounts[username] || 0);

        // Calculate total counts for each user
        const users = usernames.map(username => {
          return {
            username: username,
            sent: this.sentMessageCounts[username] || 0,
            received: this.receivedMessageCounts[username] || 0,
            total: (this.sentMessageCounts[username] || 0) + (this.receivedMessageCounts[username] || 0)
          };
        });

        // Sort by total count
        users.sort((a, b) => b.total - a.total);

        this.sortedUsernames = users.map(user => user.username);
        this.sortedSentCounts = users.map(user => user.sent);
        this.sortedReceivedCounts = users.map(user => user.received);

        // Update chart with the fetched message counts
        this.chart.data.labels = this.sortedUsernames;
        this.chart.data.datasets[0].data = this.sortedSentCounts;
        this.chart.data.datasets[1].data = this.sortedReceivedCounts;
        this.chart.update();

        // Log after assigning values
        console.log(this.receivedMessageCounts);
        console.log(this.sentMessageCounts);
      },
      error => console.error(error)  // handle error
    );
    this.updateChart();
  }
} 
