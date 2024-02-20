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
    public class ScreenSharingHub : Hub
    {
        private static readonly ConcurrentDictionary<int, (string RoomId, string ConnectionId)> UserRoomMap =
            new ConcurrentDictionary<int, (string RoomId, string ConnectionId)>();

        private readonly IUserRepository _userRepository;

        public ScreenSharingHub(IUserRepository userRepository)
        {
            _userRepository = userRepository;
        }

        public override async Task OnConnectedAsync()
        {
            await Clients.Caller.SendAsync("Connected");
            await base.OnConnectedAsync();
        }

        public async Task JoinRoom(string roomId)
        {
            if (string.IsNullOrEmpty(roomId))
            {
                // Handle the case when the roomId is null or empty
                return;
            }

            var userId = Context.User.GetUserId();
            UserRoomMap[userId] = (roomId, Context.ConnectionId);
            await Groups.AddToGroupAsync(Context.ConnectionId, roomId);
            await Clients.OthersInGroup(roomId).SendAsync("UserJoined", userId);
        }

        public async Task SendScreenOffer(int targetUser, string offer)
        {
            var (roomId, _) = UserRoomMap.GetValueOrDefault(Context.User.GetUserId());
            var (_, targetConnectionId) = UserRoomMap.GetValueOrDefault(targetUser);
            if (roomId == null || targetConnectionId == null) return;
            await Clients.Client(targetConnectionId).SendAsync("ReceiveScreenOffer", Context.User.GetUserId(), offer);
        }
        public async Task SendScreenAnswer(int targetUser, string answer)
        {
            var (roomId, _) = UserRoomMap.GetValueOrDefault(Context.User.GetUserId());
            var (_, targetConnectionId) = UserRoomMap.GetValueOrDefault(targetUser);
            if (roomId == null || targetConnectionId == null) return;
            await Clients.Client(targetConnectionId).SendAsync("ReceiveScreenAnswer", Context.User.GetUserId(), answer);
        }

        public async Task StopScreenSharing(int targetUser)
        {
            var (roomId, _) = UserRoomMap.GetValueOrDefault(Context.User.GetUserId());
            var (_, targetConnectionId) = UserRoomMap.GetValueOrDefault(targetUser);
            if (roomId == null || targetConnectionId == null) return;
            await Clients.Client(targetConnectionId).SendAsync("StopScreenSharing", Context.User.GetUserId());
        }

        public async Task SendScreenSharingEnded(int targetUser)
        {
            var (roomId, _) = UserRoomMap.GetValueOrDefault(Context.User.GetUserId());
            var (_, targetConnectionId) = UserRoomMap.GetValueOrDefault(targetUser);
            if (roomId == null || targetConnectionId == null) return;
            await Clients.Client(targetConnectionId).SendAsync("ReceiveScreenSharingEnded", Context.User.GetUserId());
        }


        public async Task SendIceCandidate(int targetUser, string candidate)
        {
            var (roomId, _) = UserRoomMap.GetValueOrDefault(Context.User.GetUserId());
            var (_, targetConnectionId) = UserRoomMap.GetValueOrDefault(targetUser);
            if (roomId == null || targetConnectionId == null) return;
            await Clients.Client(targetConnectionId).SendAsync("ReceiveIceCandidate", Context.User.GetUserId(), candidate);
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