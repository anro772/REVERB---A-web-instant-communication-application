using API.DTOs;
using API.Entities;
using API.Extensions;
using API.Interfaces;
using AutoMapper;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;
using System;

namespace API.SignalR
{
    [Authorize]
    public class GroupMessageHub:Hub
    {
        private readonly IMapper _mapper;
        private readonly IUnitOfWork _uow;

        public GroupMessageHub(IMapper mapper, IUnitOfWork uow)
        {
            _mapper = mapper;
            _uow = uow;
        }

        public override async Task OnConnectedAsync()
        {
            // Add to a group based on the groupId, you might need to adjust the context items based on your needs.
            var groupId = Context.GetHttpContext().Request.Query["groupId"].ToString();
            await Groups.AddToGroupAsync(Context.ConnectionId, groupId);


            var userId = Context.User.GetUserId();
            
            //Load existing messages for the group
            var groupMessages = _uow.MessageRepository.GetGroupMessages(int.Parse(groupId), userId);
            await Clients.Caller.SendAsync("ReceiveGroupMessageThread", _mapper.Map<IEnumerable<MessageDto>>(groupMessages));
            
            await base.OnConnectedAsync();
        }

        public async Task SendMessageToGroup(GroupMessageDto groupMessageDto)
        {
            var message = await _uow.MessageRepository.AddGroupMessage(groupMessageDto);
            if (message != null)
            {
                await Clients.Group(groupMessageDto.GroupId.ToString()).SendAsync("NewGroupMessage", _mapper.Map<MessageDto>(message));
            }
        }
    }
}
