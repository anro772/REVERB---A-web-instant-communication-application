using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using API.Interfaces;
using API.Entities;
using Microsoft.EntityFrameworkCore;
using API.DTOs;
using AutoMapper.QueryableExtensions;

namespace API.Data
{
    public class FriendRequestRepository : IFriendRequestRepository
    {
        private readonly DataContext _context;
        private readonly AutoMapper.IMapper _mapper;

        public FriendRequestRepository(DataContext context, AutoMapper.IMapper mapper)
        {
            _context = context;
            _mapper = mapper;
        }

        public async Task<FriendRequest> GetFriendRequest(int id)
        {
            return await _context.FriendRequests.FindAsync(id);
        }

        public async Task<IEnumerable<FriendRequestDto>> GetFriendRequestsForUser(int userId)
        {
            var friendRequests = await _context.FriendRequests
                .Include(fr => fr.Requester)
                .Include(fr => fr.Requested)
                .Where(fr => fr.RequestedId == userId)
                .ToListAsync();

            return friendRequests.Select(fr => new FriendRequestDto
            {
                FriendRequestId = fr.FriendRequestId,
                RequesterUsername = fr.Requester.UserName,
                RequestedUsername = fr.Requested.UserName,
                Accepted = fr.Accepted,
                Handled = fr.Handled
            });
        }

        public async Task<bool> FriendRequestExists(int requesterId, int requestedId)
        {
            return await _context.FriendRequests
                .AnyAsync(fr =>
                    fr.RequesterId == requesterId &&
                    fr.RequestedId == requestedId && 
                    fr.Handled == true && 
                    fr.Accepted == true);
        }

        public async Task<bool> FriendRequestUnhandled(int requesterId, int requestedId)
        {
            return await _context.FriendRequests
                .AnyAsync(fr =>
                    fr.RequesterId == requesterId &&
                    fr.RequestedId == requestedId &&
                    fr.Handled == false &&
                    fr.Accepted == false);
        }

        public void AddFriendRequest(FriendRequest friendRequest)
        {
            _context.FriendRequests.Add(friendRequest);
        }

        public void AcceptFriendRequest(FriendRequest friendRequest)
        {
            friendRequest.Accepted = true;
            friendRequest.Handled = true;
            _context.FriendRequests.Update(friendRequest);
        }

        public void DeclineFriendRequest(FriendRequest friendRequest)
        {
            friendRequest.Accepted = false;
            friendRequest.Handled = true;
            _context.FriendRequests.Update(friendRequest);
        }

        public async Task<IEnumerable<MemberDto>> GetFriendsForUser(int userId)
        {
            var friendIds = await _context.FriendRequests
                .Where(fr => fr.Accepted == true && (fr.RequesterId == userId || fr.RequestedId == userId))
                .Select(fr => fr.RequesterId == userId ? fr.RequestedId : fr.RequesterId)
                .ToListAsync();

            var friends = await _context.Users
                .Where(u => friendIds.Contains(u.Id))
                .ProjectTo<MemberDto>(_mapper.ConfigurationProvider) // Map AppUser objects to MemberDto objects
                .ToListAsync();

            return friends;
        }
    }
}
