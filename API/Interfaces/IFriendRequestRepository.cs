using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using API.Entities;
using API.DTOs;

namespace API.Interfaces
{
    public interface IFriendRequestRepository
    {
        Task<FriendRequest> GetFriendRequest(int id);
        Task<IEnumerable<FriendRequestDto>> GetFriendRequestsForUser(int userId);
        Task<bool> FriendRequestExists(int requesterId, int requestedId);
        void AddFriendRequest(FriendRequest friendRequest);
        void AcceptFriendRequest(FriendRequest friendRequest);
        Task<IEnumerable<MemberDto>> GetFriendsForUser(int userId);
        void DeclineFriendRequest(FriendRequest friendRequest);
        Task<bool> FriendRequestUnhandled(int requesterId, int requestedId);
    }
}