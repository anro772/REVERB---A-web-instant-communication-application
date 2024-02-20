using API.DTOs;
using API.Entities;
using API.Extensions;
using API.Helpers;
using API.Interfaces;
using AutoMapper;
using Microsoft.AspNetCore.Mvc;
using System.Collections.Generic;
using System.Security.Claims;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Http;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Http;

namespace API.Controllers
{
    public class MessagesController : BaseApiController
    {
        private readonly IMapper _mapper;
        private readonly IUnitOfWork _uow;
        public MessagesController(IMapper mapper, IUnitOfWork uow)
        {
            _uow = uow;
            _mapper = mapper;
        }

        [HttpPost]
        public async Task<ActionResult<MessageDto>> CreateMessage(CreateMessageDto createMessageDto)
        {
            var username = User.GetUsername();

            if (username == createMessageDto.RecipientUsername.ToLower())
                return BadRequest("You cannot send messages to yourself");

            var sender = await _uow.UserRepository.GetUserByUsernameAsync(username);
            var recipient = await _uow.UserRepository.GetUserByUsernameAsync(createMessageDto.RecipientUsername);

            if (recipient == null) return NotFound();

            var message = new Message
            {
                Sender = sender,
                Recipient = recipient,
                SenderUsername = sender.UserName,
                RecipientUsername = recipient.UserName,
                Content = createMessageDto.Content
            };

            _uow.MessageRepository.AddMessage(message);

            if (await _uow.Complete()) return Ok(_mapper.Map<MessageDto>(message));

            return BadRequest("Failed to send message");
        }

        //function to get last message of userId with groupId==null
        [HttpGet("lastMessage/{userId}")]
        public async Task<ActionResult<MessageDto>> GetLastMessage(int userId)
        {
            var username = User.GetUsername();

            var message = await _uow.MessageRepository.GetLastMessage(userId);

            return Ok(_mapper.Map<MessageDto>(message));
        }

        [HttpGet]
        public async Task<ActionResult<PagedList<MessageDto>>> GetMessagesForUser([FromQuery]
            MessageParams messageParams)
        {
            messageParams.Username = User.GetUsername();

            var messages = await _uow.MessageRepository.GetMessagesForUser(messageParams);

            Response.AddPaginationHeader(new PaginationHeader(messages.CurrentPage, messages.PageSize,
                messages.TotalCount, messages.TotalPages));

            return messages;
        }

        [HttpGet("nullGroup")]
        public async Task<ActionResult<PagedList<MessageDto>>> GetMessagesForUserNullGroup([FromQuery]
            MessageParams messageParams)
        {
            messageParams.Username = User.GetUsername();

            var messages = await _uow.MessageRepository.GetMessagesForUserNullGroup(messageParams);

            Response.AddPaginationHeader(new PaginationHeader(messages.CurrentPage, messages.PageSize,
                messages.TotalCount, messages.TotalPages));

            return messages;
        }

        [HttpGet("allUserMessages")]
        public async Task<ActionResult<IEnumerable<MessageDto>>> GetAllUserMessages()
        {
            var username = User.GetUsername();

            var messages = await _uow.MessageRepository.GetAllUserMessages(username);

            return Ok(_mapper.Map<IEnumerable<MessageDto>>(messages));
        }

        [HttpDelete("{id}")]
        public async Task<ActionResult> DeleteMessage(int id)
        {
            var username = User.GetUsername();

            var message = await _uow.MessageRepository.GetMessage(id);

            if (message.SenderUsername != username && message.RecipientUsername != username)
                return Unauthorized();

            if (message.SenderUsername == username) message.SenderDeleted = true;
            if (message.RecipientUsername == username) message.RecipientDeleted = true;

            if (message.SenderDeleted && message.RecipientDeleted)
            {
                _uow.MessageRepository.DeleteMessage(message);
            }

            if (await _uow.Complete()) return Ok();

            return BadRequest("Problem deleting the message");

        }
        [HttpGet("group/{groupId}")]
        public ActionResult<IEnumerable<MessageDto>> GetGroupMessages(int groupId)
        {

            var userId = User.GetUserId();

            var messages = _uow.MessageRepository.GetGroupMessages(groupId, userId);

            return Ok(_mapper.Map<IEnumerable<MessageDto>>(messages));
        }

        [HttpPost("group/{groupId}")]
        public async Task<ActionResult<GroupMessageDto>> CreateGroupMessage(GroupMessageDto groupMessageDto, int groupId)
        {
            var senderUsername = User.GetUsername();
            groupMessageDto.GroupId = groupId;

            groupMessageDto.SenderUsername = senderUsername;

            var addedMessage = await _uow.MessageRepository.AddGroupMessage(groupMessageDto);

            if (addedMessage != null)
            {
                return Ok(groupMessageDto);
            }

            return BadRequest("Failed to send group message");
        }
    }
}