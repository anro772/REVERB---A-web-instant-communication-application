using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using API.Entities;
using Microsoft.AspNetCore.SignalR;
using Microsoft.AspNetCore.Authorization;
using System.Collections.Concurrent;
using API.Interfaces;
using API.Extensions;

namespace API.SignalR
{
    [Authorize]
    public class VideoChatHub : Hub
    {
        private static readonly ConcurrentDictionary<int, (string RoomId, string ConnectionId)> UserRoomMap =
        new ConcurrentDictionary<int, (string RoomId, string ConnectionId)>();

        private readonly IUserRepository _userRepository;

        public VideoChatHub(IUserRepository userRepository)
        {
            _userRepository = userRepository;
        }

        public override async Task OnConnectedAsync()
        {
            await Clients.Caller.SendAsync("Connected");
            await base.OnConnectedAsync();
        }

        // Method to join a room
        public async Task JoinRoom(string roomId)
        {
            if (string.IsNullOrEmpty(roomId))
            {
                // Handle the case when the roomId is null or empty
                return;
            }

            var userId = Context.User.GetUserId();

            // Rest of the code to join the room
            UserRoomMap[userId] = (roomId, Context.ConnectionId);
            await Groups.AddToGroupAsync(Context.ConnectionId, roomId);
            await Clients.OthersInGroup(roomId).SendAsync("UserJoined", userId);
        }


        // Method to handle sending of offer
        public async Task SendOffer(int targetUser, string offer)
        {
            var (roomId, _) = UserRoomMap.GetValueOrDefault(Context.User.GetUserId());
            var (_, targetConnectionId) = UserRoomMap.GetValueOrDefault(targetUser);
            if (roomId == null || targetConnectionId == null) return;
            await Clients.Client(targetConnectionId).SendAsync("ReceiveOffer", Context.User.GetUserId(), offer);
        }

        // Method to handle sending of answer
        public async Task SendAnswer(int targetUser, string answer)
        {
            var (roomId, _) = UserRoomMap.GetValueOrDefault(Context.User.GetUserId());
            var (_, targetConnectionId) = UserRoomMap.GetValueOrDefault(targetUser);
            if (roomId == null || targetConnectionId == null) return;
            await Clients.Client(targetConnectionId).SendAsync("ReceiveAnswer", Context.User.GetUserId(), answer);
        }


        // Method to handle sending of ICE Candidate
        // Method to handle sending of ICE Candidate
        public async Task SendIceCandidate(int targetUser, string candidate)
        {
            var (roomId, _) = UserRoomMap.GetValueOrDefault(Context.User.GetUserId());
            var (_, targetConnectionId) = UserRoomMap.GetValueOrDefault(targetUser);
            if (roomId == null || targetConnectionId == null) return;
            await Clients.Client(targetConnectionId).SendAsync("ReceiveIceCandidate", Context.User.GetUserId(), candidate);
        }

        // Method to handle sending of Video Status
        public async Task SendVideoStatus(int targetUser, bool status)
        {
            var (roomId, _) = UserRoomMap.GetValueOrDefault(Context.User.GetUserId());
            var (_, targetConnectionId) = UserRoomMap.GetValueOrDefault(targetUser);
            if (roomId == null || targetConnectionId == null) return;
            await Clients.Client(targetConnectionId).SendAsync("ReceiveVideoStatus", Context.User.GetUserId(), status);
        }

        public override async Task OnDisconnectedAsync(Exception exception)
        {
            var userId = Context.User.GetUserId();
            UserRoomMap.TryRemove(userId, out _);
            // TODO: Leave the room group
            await base.OnDisconnectedAsync(exception);
        }
    }
}