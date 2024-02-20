using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using API.Entities;
using API.DTOs;

namespace API.Interfaces
{
    public interface IUserGroupRepository
    {
        Task<bool> AddUserToGroup(int userId, int groupId, bool isOwner, bool accepted, bool handled);
        Task<IEnumerable<AppUser>> GetGroupMembers(int groupId);
        Task<bool> InviteUserToGroup(int userId, int groupId);
        Task<bool> AcceptInvitation(int userId, int groupId);
        Task<IEnumerable<UserGroupDto>> GetUserGroups();
        Task<IEnumerable<Group>> GetGroups();
        Task<IEnumerable<Group>> GetGroupsForUser(int userId);
        Task<IEnumerable<UserGroupDto>> GetUserGroupsForUser(int userId);
        Task<UserGroup> GetInvitation(int userId, int groupId);
        Task<IEnumerable<UserGroupDto>> GetUserGroupsForUserAccepted(int userId);
        Task<bool> DeclineInvitation(int userId, int groupId);
        Task<IEnumerable<UserGroup>> GetInvitationsForUser(int userId);
        Task<IEnumerable<UserGroup>> GetInvitationsForUserHandled(int userId);
        Task<bool> UnhandledInvitationExists(int userId, int groupId);
        Task<bool> ExistingInvitation(int userId, int groupId);
        void AddGroupInvitation(UserGroup userGroup);
        Task<UserGroup> GetUserGroup(int userId, int groupId);
    }
}