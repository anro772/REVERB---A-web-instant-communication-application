using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.SignalR;
using Microsoft.AspNetCore.Authorization;
using API.Interfaces;
using API.Extensions;
using API.Data;
using API.DTOs;

namespace API.SignalR
{
    [Authorize]
    public class NotificationHub : Hub
    {
        private readonly IUserGroupRepository _userGroupRepository;
        private readonly IFriendRequestRepository _friendRequestRepository;
        public NotificationHub(IUserGroupRepository userGroupRepository, IFriendRequestRepository friendRequestRepository)
        {
            _userGroupRepository = userGroupRepository;
            _friendRequestRepository = friendRequestRepository;
        }

        public override async Task OnConnectedAsync()
        {
            var userId = Context.User.GetUserId();
            if (userId != 0)
            {
                await SendFriendRequests(userId);
                await SendGroupInvitations(userId);
            }

            await base.OnConnectedAsync();
        }

        private async Task SendFriendRequests(int userId)
        {
            var friendRequests = await _friendRequestRepository.GetFriendRequestsForUser(userId);
            await Clients.User(userId.ToString()).SendAsync("ReceiveFriendRequests", friendRequests);
        }

        private async Task SendGroupInvitations(int userId)
        {
            var groupInvitations = await _userGroupRepository.GetInvitationsForUser(userId);
            await Clients.User(userId.ToString()).SendAsync("ReceiveGroupInvitations", groupInvitations);
        }

    }
}