using API.DTOs;
using API.Entities;
using API.Interfaces;
using AutoMapper;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Threading.Tasks;
using System.Security.Claims;
using API.Extensions;
using System.Collections.Generic;
using API.Data;
using Microsoft.AspNetCore.Http;


namespace API.Controllers
{
    public class GroupController : BaseApiController
    {
        private readonly UserManager<AppUser> _userManager;
        private readonly IMapper _mapper;
        private readonly IUnitOfWork _uow;
        private readonly IUserGroupRepository _userGroupRepository;
        private readonly IPhotoService _photoService;
        private readonly IGroupService _groupService;

        public GroupController(UserManager<AppUser> userManager, IMapper mapper, IUnitOfWork uow, IUserGroupRepository userGroupRepository,
            IPhotoService photoService, IGroupService groupService)
        {
            _userManager = userManager;
            _mapper = mapper;
            _uow = uow;
            _userGroupRepository = userGroupRepository;
            _photoService = photoService;
            _groupService = groupService;
        }

        [HttpPost("create")]
        public async Task<ActionResult<GroupDto>> CreateGroup([FromForm] CreateGroupDto createGroupDto)
        {
            string currentUsername = User.FindFirstValue(ClaimTypes.Name);

            var user = await _userManager.Users
                .Include(p => p.Groups)
                .SingleOrDefaultAsync(x => x.UserName == currentUsername);

            if (user == null) return Unauthorized("Invalid username");

            var group = _groupService.CreateGroup(user.Id, createGroupDto.Name, createGroupDto.Photo);

            var groupDto = _mapper.Map<GroupDto>(group);
            return Ok(groupDto);
        }

        [HttpGet("{groupId}")]
        public async Task<ActionResult<GroupDto>> GetGroup(int groupId)
        {
            var group = await _uow.MessageRepository.GetGroup(groupId);

            return _mapper.Map<GroupDto>(group);
        }

        [HttpDelete("delete/{groupName}")]
        public async Task<ActionResult> DeleteGroup(string groupName)
        {
            var group = await _uow.MessageRepository.GetMessageGroup(groupName);
            var username = User.GetUsername();

            if (group == null)
                return NotFound();

            await _uow.MessageRepository.DeleteGroup(group);

            var saveResult = await _uow.Complete();
            if (!saveResult)
            {
                group = await _uow.MessageRepository.GetMessageGroup(groupName);
                if (group == null)
                {
                    return Ok("The group was deleted"); // Group deletion was successful but EF did not detect any changes
                }
            }
            else
            {
                return Ok("The group was deleted"); // Changes were detected and the transaction was committed successfully
            }

            return BadRequest("Failed to delete group");
        }

        [HttpPost("upload-photo")]
        public async Task<ActionResult> UploadPhoto([FromForm] PhotoUploadDto photoUploadDto)
        {
            // Ensure a file has been uploaded
            if (photoUploadDto.File == null || photoUploadDto.File.Length == 0)
            {
                return BadRequest("No file provided or file is empty");
            }

            var uploadResult = await _photoService.AddPhotoAsync(photoUploadDto.File);

            if (uploadResult.Error != null)
            {
                return BadRequest(uploadResult.Error.Message);
            }

            return Ok(new { photoUrl = uploadResult.SecureUrl.AbsoluteUri });
        }

        [HttpGet("groups")]
        public async Task<ActionResult<IEnumerable<GroupDto>>> GetGroups()
        {
            var groups = await _userGroupRepository.GetGroups();

            return Ok(_mapper.Map<IEnumerable<GroupDto>>(groups));
        }

        [HttpGet("groups/{userId}")]
        public async Task<ActionResult<IEnumerable<GroupDto>>> GetGroupsForUser(int userId)
        {
            var groups = await _userGroupRepository.GetGroupsForUser(userId);

            return Ok(_mapper.Map<IEnumerable<GroupDto>>(groups));
        }
    }
}
