using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using API.Data;
using API.Entities;
using API.Interfaces;
using Microsoft.EntityFrameworkCore;
using API.DTOs;

namespace API.Data
{
    public class UserGroupRepository : IUserGroupRepository
    {
        private readonly DataContext _context;
        private readonly AutoMapper.IMapper _mapper;

        public UserGroupRepository(DataContext context, AutoMapper.IMapper mapper)
        {
            _context = context;
            _mapper = mapper;
        }

        public async Task<bool> AddUserToGroup(int userId, int groupId, bool isOwner = false, bool accepted = true, bool handled = false)
        {
            var user = await _context.Users.FindAsync(userId);
            var group = await _context.Groups.FindAsync(groupId);

            if (user != null && group != null)
            {
                var userGroup = new UserGroup
                {
                    AppUserId = user.Id,
                    GroupId = group.GroupId,
                    IsOwner = isOwner,
                    Accepted = accepted,
                    Handled = handled
                };

                await _context.UserGroups.AddAsync(userGroup);

                var result = await _context.SaveChangesAsync();
                return result > 0;
            }

            return false;
        }

        public async Task<IEnumerable<AppUser>> GetGroupMembers(int groupId)
        {
            var group = await _context.Groups.Include(g => g.UserGroups).ThenInclude(ug => ug.AppUser).SingleOrDefaultAsync(g => g.GroupId == groupId);
            return group?.UserGroups.Where(ug => ug.Accepted && ug.Handled).Select(ug => ug.AppUser);
        }


        public async Task<bool> InviteUserToGroup(int userId, int groupId)
        {

            // //check if usergroup with userId and groupId already exists
            var existingUserGroup = await _context.UserGroups.FirstOrDefaultAsync(ug => ug.AppUserId == userId && ug.GroupId == groupId &&
            (ug.Accepted == false && ug.Handled == false) || (ug.Accepted == true && ug.Handled == false));

            if (existingUserGroup != null)
                return false;

            var userGroup = new UserGroup
            {
                AppUserId = userId,
                GroupId = groupId,
                Accepted = false,
                Handled = false
            };

            _context.UserGroups.Add(userGroup);

            return await _context.SaveChangesAsync() > 0;
        }

        public void AddGroupInvitation(UserGroup userGroup)
        {
            _context.UserGroups.Add(userGroup);
        }

        public async Task<UserGroup> GetInvitation(int userId, int groupId)
        {
            return await _context.UserGroups
                .FirstOrDefaultAsync(ug => ug.AppUserId == userId && ug.GroupId == groupId && ug.Accepted == true && ug.Handled == true);
        }

        public async Task<UserGroup> GetUserGroup(int userId, int groupId)
        {
            return await _context.UserGroups
                .FirstOrDefaultAsync(ug => ug.AppUserId == userId && ug.GroupId == groupId);
        }

        public async Task<bool> ExistingInvitation(int userId, int groupId)
        {
            return await _context.UserGroups
                .AnyAsync(ug => ug.AppUserId == userId && ug.GroupId == groupId && ug.Handled == false && ug.Accepted == false);
        }

        public async Task<bool> UnhandledInvitationExists(int userId, int groupId)
        {
            return await _context.UserGroups
                .AnyAsync(ug => ug.AppUserId == userId && ug.GroupId == groupId && ug.Handled == false && ug.Accepted == false);
        }

        public async Task<bool> AcceptInvitation(int userId, int groupId)
        {
            var userGroup = await _context.UserGroups.FirstOrDefaultAsync(ug => ug.AppUserId == userId && ug.GroupId == groupId);

            if (userGroup == null)
                return false;

            userGroup.Accepted = true;
            userGroup.Handled = true;

            return await _context.SaveChangesAsync() > 0;
        }

        public async Task<bool> DeclineInvitation(int userId, int groupId)
        {
            var userGroup = await _context.UserGroups.FirstOrDefaultAsync(ug => ug.AppUserId == userId && ug.GroupId == groupId);

            if (userGroup == null)
                return false;

            userGroup.Handled = true;

            return await _context.SaveChangesAsync() > 0;
        }

        public async Task<IEnumerable<UserGroup>> GetInvitationsForUserHandled(int userId)
        {
            return await _context.UserGroups
                .Include(ug => ug.Group)
                    .ThenInclude(g => g.UserGroups)
                        .ThenInclude(ug => ug.AppUser)
                .Where(ug => ug.AppUserId == userId && !ug.Handled)
                .ToListAsync();
        }

        public async Task<IEnumerable<UserGroup>> GetInvitationsForUser(int userId)
        {
            return await _context.UserGroups
                .Include(ug => ug.Group)
                    .ThenInclude(g => g.UserGroups)
                        .ThenInclude(ug => ug.AppUser)
                .Where(ug => ug.AppUserId == userId)
                .ToListAsync();
        }


        public async Task<IEnumerable<Group>> GetGroups()
        {
            return await _context.Groups.ToListAsync();
        }

        public async Task<IEnumerable<UserGroupDto>> GetUserGroups()
        {
            var groups = await _context.Groups
                .Include(g => g.UserGroups)
                .ThenInclude(ug => ug.AppUser)
                .ToListAsync();

            var userGroupDtos = groups.Select(g => new UserGroupDto
            {
                GroupId = g.GroupId,
                Members = g.UserGroups.Select(ug => new GroupMemberDto
                {
                    UserId = ug.AppUserId,
                    GroupId = ug.GroupId,
                    IsOwner = ug.IsOwner,
                    Accepted = ug.Accepted,
                    Handled = ug.Handled
                }).ToList()
            });

            return userGroupDtos;
        }

        public async Task<IEnumerable<Group>> GetGroupsForUser(int userId)
        {
            var groups = await _context.Groups
                .Include(g => g.UserGroups)
                .ThenInclude(ug => ug.AppUser)
                .Where(g => g.UserGroups.Any(ug => ug.AppUserId == userId))
                .ToListAsync();

            return groups;
        }

        public async Task<IEnumerable<UserGroupDto>> GetUserGroupsForUserAccepted(int userId)
        {
            var groups = await _context.Groups
                .Include(g => g.UserGroups)
                .ThenInclude(ug => ug.AppUser)
                .Where(g => g.UserGroups.Any(ug => ug.AppUserId == userId && ug.Accepted == true && ug.Handled == true))
                .ToListAsync();

            var userGroupDtos = groups.Select(g => new UserGroupDto
            {
                GroupId = g.GroupId,
                Members = g.UserGroups.Select(ug => new GroupMemberDto
                {
                    UserId = ug.AppUserId,
                    GroupId = ug.GroupId,
                    IsOwner = ug.IsOwner,
                    Accepted = ug.Accepted,
                    Handled = ug.Handled
                }).ToList()
            });

            return userGroupDtos;
        }

        public async Task<IEnumerable<UserGroupDto>> GetUserGroupsForUser(int userId)
        {
            var groups = await _context.Groups
                .Include(g => g.UserGroups)
                .ThenInclude(ug => ug.AppUser)
                .Where(g => g.UserGroups.Any(ug => ug.AppUserId == userId))
                .ToListAsync();

            var userGroupDtos = groups.Select(g => new UserGroupDto
            {
                GroupId = g.GroupId,
                Members = g.UserGroups.Select(ug => new GroupMemberDto
                {
                    UserId = ug.AppUserId,
                    GroupId = ug.GroupId,
                    IsOwner = ug.IsOwner,
                    Accepted = ug.Accepted,
                    Handled = ug.Handled
                }).ToList()
            });

            return userGroupDtos;
        }
    }
}
