using System.Threading.Tasks;
using API.DTOs;
using API.Interfaces;
using Microsoft.AspNetCore.Mvc;
using System.Collections.Generic;
using AutoMapper;
using API.Entities;
using API.Data;
using Microsoft.AspNetCore.SignalR;
using API.SignalR;
using Microsoft.AspNetCore.Identity;

namespace API.Controllers
{
    public class UserGroupController : BaseApiController
    {
        private readonly IUserGroupRepository _userGroupRepository;
        private readonly IMapper _mapper;
        private readonly IGroupService _groupService;
        private readonly UserManager<AppUser> _userManager;
        private readonly IHubContext<NotificationHub> _hubContext;
        private readonly IUnitOfWork _unitOfWork;

        public UserGroupController(IUserGroupRepository userGroupRepository, IMapper mapper, IGroupService groupService,
            UserManager<AppUser> userManager, IHubContext<NotificationHub> hubContext, IUnitOfWork unitOfWork)
        {
            _userGroupRepository = userGroupRepository;
            _mapper = mapper;
            _groupService = groupService;
            _userManager = userManager;
            _hubContext = hubContext;
            _unitOfWork = unitOfWork;
        }

        [HttpPost("add")]
        public async Task<ActionResult> AddUserToGroup(AddUserToGroupDto addUserToGroupDto)
        {
            var result = await _userGroupRepository.AddUserToGroup(addUserToGroupDto.UserId, addUserToGroupDto.GroupId, false, true, true);

            if (!result)
                return BadRequest("Failed to add user to group");

            return Ok("User added to group");
        }

        [HttpGet("members/{groupId}")]
        public async Task<ActionResult<IEnumerable<MemberDto>>> GetGroupMembers(int groupId)
        {
            var users = await _userGroupRepository.GetGroupMembers(groupId);

            return Ok(_mapper.Map<IEnumerable<MemberDto>>(users));
        }

        [HttpPost("invite")]
        public async Task<ActionResult> InviteUserToGroup(InviteUserToGroupDto inviteUserToGroupDto)
        {
            var existingUserGroup = await _unitOfWork.UserGroupRepository.GetUserGroup(inviteUserToGroupDto.UserId, inviteUserToGroupDto.GroupId);

            if (existingUserGroup != null)
            {
                if (existingUserGroup.Handled && !existingUserGroup.Accepted)
                {
                    existingUserGroup.Handled = false;
                    existingUserGroup.Accepted = false;
                }
                else
                {
                    return BadRequest("Invitation already sent to this user for this group");
                }
            }
            else
            {
                existingUserGroup = new UserGroup
                {
                    AppUserId = inviteUserToGroupDto.UserId,
                    GroupId = inviteUserToGroupDto.GroupId,
                    Accepted = false,
                    Handled = false
                };

                _unitOfWork.UserGroupRepository.AddGroupInvitation(existingUserGroup);
            }

            var user = await _userManager.FindByIdAsync(inviteUserToGroupDto.UserId.ToString());
            if (user == null)
                return NotFound("User not found");

            var group = await _userGroupRepository.GetUserGroupsForUser(inviteUserToGroupDto.GroupId);
            if (group == null)
                return NotFound("Group not found");

            var result = await _unitOfWork.Complete();
            if (!result) return BadRequest("Failed to send friend request");

            var userGroupDto = new UserGroupDto
            {
                GroupId = inviteUserToGroupDto.GroupId,
                Members = new List<GroupMemberDto>
        {
            new GroupMemberDto
            {
                UserId = inviteUserToGroupDto.UserId,
                GroupId = inviteUserToGroupDto.GroupId,
                IsOwner = false,
                Accepted = false,
                Handled = false,
                Type="groupInvite"
            }
        }
            };

            // Send notification
            await _hubContext.Clients.User(user.Id.ToString()).SendAsync("ReceiveGroupInvitations", userGroupDto);

            return Ok("User invited to group");
        }

        [HttpPost("accept-invitation")]
        public async Task<ActionResult> AcceptInvitation(AcceptInvitationDto acceptInvitationDto)
        {
            int currentUserId = GetUserId();

            var result = await _userGroupRepository.AcceptInvitation(currentUserId, acceptInvitationDto.GroupId);

            if (!result)
                return BadRequest("Failed to accept invitation");

            return Ok("Invitation accepted");
        }

        [HttpPost("decline-invitation")]
        public async Task<ActionResult> DeclineInvitation(DeclineInvitationDto declineInvitationDto)
        {
            int currentUserId = GetUserId();

            var result = await _userGroupRepository.DeclineInvitation(currentUserId, declineInvitationDto.GroupId);

            if (!result)
                return BadRequest("Failed to decline invitation");

            return Ok("Invitation declined");
        }

        [HttpGet("invitations-handled/{userId}")]
        public async Task<ActionResult<IEnumerable<UserGroupDto>>> GetInvitationsForUserHandled(int userId)
        {
            var invitations = await _userGroupRepository.GetInvitationsForUserHandled(userId);

            return Ok(_mapper.Map<IEnumerable<UserGroupDto>>(invitations));
        }

        [HttpGet("invitations/{userId}")]
        public async Task<ActionResult<IEnumerable<UserGroupDto>>> GetInvitationsForUser(int userId)
        {
            var invitations = await _userGroupRepository.GetInvitationsForUser(userId);

            return Ok(_mapper.Map<IEnumerable<UserGroupDto>>(invitations));
        }

        [HttpGet("usergroups")]
        public async Task<ActionResult<IEnumerable<UserGroupDto>>> GetUserGroups()
        {
            var userGroupDtos = await _userGroupRepository.GetUserGroups();

            return Ok(userGroupDtos);
        }

        [HttpGet("usergroups/{userId}")]
        public async Task<ActionResult<IEnumerable<UserGroupDto>>> GetUserGroupsForUser(int userId)
        {
            var userGroupDtos = await _userGroupRepository.GetUserGroupsForUser(userId);

            return Ok(userGroupDtos);
        }

        [HttpGet("usergroups-accepted/{userId}")]
        public async Task<ActionResult<IEnumerable<UserGroupDto>>> GetUserGroupsForUserAccepted(int userId)
        {
            var userGroupDtos = await _userGroupRepository.GetUserGroupsForUserAccepted(userId);

            return Ok(userGroupDtos);
        }
    }
}
