using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using API.Data;
using API.Entities;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using API.Interfaces;
using API.Extensions;
using API.DTOs;
using API.SignalR;
using Microsoft.AspNetCore.SignalR;

namespace API.Controllers
{
    public class FriendRequestController : BaseApiController
    {
        private readonly UserManager<AppUser> _userManager;
        private readonly IUnitOfWork _unitOfWork;
        private readonly IHubContext<NotificationHub> _hubContext;
        public FriendRequestController(UserManager<AppUser> userManager, IUnitOfWork unitOfWork, IHubContext<NotificationHub> hubContext)
        {
            _userManager = userManager;
            _unitOfWork = unitOfWork;
            _hubContext = hubContext;
        }
        [HttpPost("{username}")]
        public async Task<IActionResult> SendFriendRequest(string username)
        {
            var requesterId = User.GetUserId();

            var requestedUser = await _userManager.Users.SingleOrDefaultAsync(x => x.UserName == username.ToLower());

            if (requestedUser == null) return NotFound("User not found");

            if (requestedUser.Id == requesterId) return BadRequest("You can't send a friend request to yourself");

            if (await _unitOfWork.FriendRequestRepository.FriendRequestExists(requesterId, requestedUser.Id))
            {
                return BadRequest("You have already sent a friend request to this user");
            }

            if(await _unitOfWork.FriendRequestRepository.FriendRequestUnhandled(requesterId, requestedUser.Id))
            {
                return BadRequest("You have already sent a friend request to this user");
            }
            
            var friendRequest = new FriendRequest
            {
                RequesterId = requesterId,
                RequestedId = requestedUser.Id,
                Accepted = false
            };

            _unitOfWork.FriendRequestRepository.AddFriendRequest(friendRequest);

            var result = await _unitOfWork.Complete();

            if (!result) return BadRequest("Failed to send friend request");

            // Prepare notification object
            var friendRequestDto = new FriendRequestDto
            {
                FriendRequestId = friendRequest.FriendRequestId,  // Assuming friendRequest.Id is assigned after saving to the database
                RequesterUsername = User.GetUsername(),  // Assuming you have this method or similar to get the username of the current user
                RequestedUsername = requestedUser.UserName,
                Accepted = friendRequest.Accepted,
                Handled = false, // Assuming the default value
                Type="friendRequest"
            };

            // Send notification
            await _hubContext.Clients.User(requestedUser.Id.ToString()).SendAsync("ReceiveFriendRequests", friendRequestDto);

            return Ok("Friend request sent successfully");
        }


        [HttpPut("accept-request/{id}")]
        public async Task<IActionResult> AcceptFriendRequest(int id)
        {
            var friendRequest = await _unitOfWork.FriendRequestRepository.GetFriendRequest(id);

            if (friendRequest == null) return NotFound("Friend request not found");

            var currentUserId = User.GetUserId();

            if (friendRequest.RequestedId != currentUserId) return Unauthorized();

            // Update the accepted and handled fields
            _unitOfWork.FriendRequestRepository.AcceptFriendRequest(friendRequest);
            friendRequest.Handled = true;

            var result = await _unitOfWork.Complete();

            if (!result) return BadRequest("Failed to accept friend request");

            return Ok("Friend request accepted");
        }

        //decline friend request
        [HttpPut("decline-request/{id}")]
        public async Task<IActionResult> DeclineFriendRequest(int id)
        {
            var friendRequest = await _unitOfWork.FriendRequestRepository.GetFriendRequest(id);

            if (friendRequest == null) return NotFound("Friend request not found");

            var currentUserId = User.GetUserId();

            if (friendRequest.RequestedId != currentUserId) return Unauthorized();

            // Update the accepted and handled fields
            _unitOfWork.FriendRequestRepository.DeclineFriendRequest(friendRequest);
            friendRequest.Handled = true;

            var result = await _unitOfWork.Complete();

            if (!result) return BadRequest("Failed to decline friend request");

            return Ok("Friend request declined");
        }

        // [HttpGet]
        // public async Task<ActionResult<IEnumerable<FriendRequestDto>>> GetFriendRequestsForUser()
        // {
        //     var userId = User.GetUserId();
        //     var friendRequests = await _unitOfWork.FriendRequestRepository.GetFriendRequestsForUser(userId);

        //     return Ok(friendRequests);
        // }

        [HttpGet("{userId}/friends")]
        public async Task<IActionResult> GetFriendsForUser(int userId)
        {
            if (userId != User.GetUserId()) return Unauthorized(); // only allow users to fetch their own friends list

            var friends = await _unitOfWork.FriendRequestRepository.GetFriendsForUser(userId);

            if (friends == null) return NotFound(); // if there's no friends list for the user, return a NotFound result

            return Ok(friends);
        }

        [HttpGet("{userId}/friend-requests")]
        public async Task<IActionResult> GetFriendRequestsForUser(int userId)
        {
            if (userId != User.GetUserId()) return Unauthorized(); // only allow users to fetch their own friend requests

            var friendRequests = await _unitOfWork.FriendRequestRepository.GetFriendRequestsForUser(userId);

            if (friendRequests == null) return NotFound(); // if there's no friend requests for the user, return a NotFound result

            return new OkObjectResult(friendRequests);
        }
    }
}