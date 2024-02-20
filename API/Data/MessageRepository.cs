using API.DTOs;
using API.Entities;
using API.Helpers;
using API.Interfaces;
using AutoMapper;
using AutoMapper.QueryableExtensions;
using Microsoft.EntityFrameworkCore;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using System;

namespace API.Data
{
    public class MessageRepository : IMessageRepository
    {
        private readonly DataContext _context;
        private readonly IMapper _mapper;
        public MessageRepository(DataContext context, IMapper mapper)
        {
            _mapper = mapper;
            _context = context;
        }

        public void AddGroup(Group group)
        {
            _context.Groups.Add(group);
        }

        public void AddMessage(Message message)
        {
            _context.Messages.Add(message);
        }

        public void DeleteMessage(Message message)
        {
            _context.Messages.Remove(message);
        }

        public async Task<Connection> GetConnection(string connectionId)
        {
            return await _context.Connections.FindAsync(connectionId);
        }

        public async Task<Group> GetGroup(int groupId)
        {
            return await _context.Groups
                .Include(x => x.Connections)
                .FirstOrDefaultAsync(x => x.GroupId == groupId);
        }

        public async Task<Group> GetGroupForConnection(string connectionId)
        {
            return await _context.Groups
                .Include(x => x.Connections)
                .Where(x => x.Connections.Any(c => c.ConnectionId == connectionId))
                .FirstOrDefaultAsync();
        }

        public async Task<IEnumerable<Group>> GetGroupsForUser(string username)
        {
            return await _context.Groups
                .Include(x => x.Connections)
                .Where(x => x.Connections.Any(c => c.Username == username))
                .ToListAsync();
        }


        public async Task<Message> GetMessage(int id)
        {
            return await _context.Messages.FindAsync(id);
        }

        public async Task<Group> GetMessageGroup(string groupName)
        {
            return await _context.Groups
                .Include(x => x.Connections)
                .FirstOrDefaultAsync(x => x.Name == groupName);
        }

        public async Task<PagedList<MessageDto>> GetMessagesForUser(MessageParams messageParams)
        {
            var query = _context.Messages
                .OrderByDescending(x => x.MessageSent)
                .AsQueryable();

            query = messageParams.Container switch
            {
                "Inbox" => query.Where(u => u.RecipientUsername == messageParams.Username
                    && u.RecipientDeleted == false),
                "Outbox" => query.Where(u => u.SenderUsername == messageParams.Username
                    && u.SenderDeleted == false),
                _ => query.Where(u => u.RecipientUsername == messageParams.Username
                    && u.RecipientDeleted == false && u.DateRead == null)
            };

            var messages = query.ProjectTo<MessageDto>(_mapper.ConfigurationProvider);

            return await PagedList<MessageDto>
                .CreateAsync(messages, messageParams.PageNumber, messageParams.PageSize);
        }

        //get the messages that have no group
        public async Task<PagedList<MessageDto>> GetMessagesForUserNullGroup(MessageParams messageParams)
        {
            var query = _context.Messages
                .OrderByDescending(x => x.MessageSent)
                .Where(m => m.GroupId == null)
                .AsQueryable();

            query = messageParams.Container switch
            {
                "Inbox" => query.Where(u => u.RecipientUsername == messageParams.Username
                    && u.RecipientDeleted == false),
                "Outbox" => query.Where(u => u.SenderUsername == messageParams.Username
                    && u.SenderDeleted == false),
                _ => query.Where(u => u.RecipientUsername == messageParams.Username
                    && u.RecipientDeleted == false && u.DateRead == null)
            };

            var messages = query.ProjectTo<MessageDto>(_mapper.ConfigurationProvider);

            return await PagedList<MessageDto>
                .CreateAsync(messages, messageParams.PageNumber, messageParams.PageSize);
        }

        public async Task<IEnumerable<MessageDto>> GetAllUserMessages(string currentUsername)
        {
            var query = _context.Messages
                .Where(
                    m => m.GroupId == null && m.RecipientUsername == currentUsername && m.RecipientDeleted == false &&
                    m.SenderUsername != currentUsername ||
                    m.RecipientUsername != currentUsername && m.SenderDeleted == false &&
                    m.SenderUsername == currentUsername && m.GroupId == null
                )
                .OrderBy(m => m.MessageSent)
                .AsQueryable();

            return await query.ProjectTo<MessageDto>(_mapper.ConfigurationProvider).ToListAsync();
        }


        public async Task<IEnumerable<MessageDto>> GetMessageThread(string currentUserName, string recipientUserName)
        {
            var query = _context.Messages
                .Where(
                    m => m.GroupId == null && m.RecipientUsername == currentUserName && m.RecipientDeleted == false &&
                    m.SenderUsername == recipientUserName ||
                    m.RecipientUsername == recipientUserName && m.SenderDeleted == false &&
                    m.SenderUsername == currentUserName && m.GroupId == null
                )
                .OrderBy(m => m.MessageSent)
                .AsQueryable();


            var unreadMessages = query.Where(m => m.DateRead == null
                && m.RecipientUsername == currentUserName).ToList();

            if (unreadMessages.Any())
            {
                foreach (var message in unreadMessages)
                {
                    message.DateRead = DateTime.UtcNow;
                }
            }

            return await query.ProjectTo<MessageDto>(_mapper.ConfigurationProvider).ToListAsync();
        }

        public void RemoveConnection(Connection connection)
        {
            _context.Connections.Remove(connection);
        }

        public async Task DeleteGroup(Group group)
        {
            _context.Groups.Remove(group);
            await _context.SaveChangesAsync();
        }

        public async Task AddUsersToGroup(string groupName, List<string> userIds)
        {
            var group = await _context.Groups.FindAsync(groupName);

            if (group == null)
            {
                // Handle the case where the group does not exist.
            }

            foreach (var userId in userIds)
            {
                var user = await _context.Users.FindAsync(userId);

                if (user != null)
                {
                    var userGroup = new UserGroup
                    {
                        AppUser = user,
                        Group = group
                    };

                    _context.UserGroups.Add(userGroup);
                }
                else
                {
                    // Handle the case where the user does not exist.
                }
            }

            await _context.SaveChangesAsync();
        }
        public IEnumerable<Message> GetGroupMessages(int groupId, int currentUserId)
        {
            var messages = _context.Messages
                .Include(m => m.Sender)
                .ThenInclude(r => r.Photo)
                .Where(m => m.GroupId == groupId && m.RecipientId == m.SenderId)
                .OrderBy(m => m.MessageSent)
                .ToList();

            var unreadMessages = _context.Messages
                .Where(m => m.GroupId == groupId && m.RecipientId != m.SenderId && m.RecipientId == currentUserId && m.DateRead == null)
                .ToList();

            foreach (var message in unreadMessages)
            {
                message.DateRead = DateTime.UtcNow;
            }

            _context.SaveChanges();

            return messages;
        }

        public async Task<Message> AddGroupMessage(GroupMessageDto groupMessageDto)
        {
            var group = await _context.Groups.FirstOrDefaultAsync(g => g.GroupId == groupMessageDto.GroupId);
            if (group == null)
                throw new Exception("Group not found");

            var sender = await _context.Users.Include(u => u.Photo).FirstOrDefaultAsync(u => u.UserName == groupMessageDto.SenderUsername);
            if (sender == null)
                throw new Exception("Sender not found");

            var groupMembers = await _context.UserGroups
                .Where(ug => ug.GroupId == group.GroupId)
                .Select(ug => ug.AppUser)
                .ToListAsync();

            var messages = groupMembers.Select(member => new Message
            {
                SenderId = sender.Id,
                RecipientId = member.Id,
                RecipientUsername = member.UserName,
                SenderUsername = sender.UserName,
                SenderPhotoUrl = sender.Photo.Url,
                GroupId = group.GroupId,
                GroupName = group.Name,
                GroupPhotoUrl = group.PhotoUrl,
                Content = groupMessageDto.Content,
                MessageSent = DateTime.UtcNow,
            }).ToList();

            // Exclude the sender from the list of messages
            //messages = messages.Where(msg => msg.RecipientId != sender.Id).ToList();

            _context.Messages.AddRange(messages);

            if (await _context.SaveChangesAsync() > 0)
            {
                return messages.FirstOrDefault(); // Return the first message as an example
            }

            throw new Exception("Failed to send message");
        }

        //        //function to get last message of userId with groupId==null

        public async Task<Message> GetLastMessage(int userId)
        {
            var message = await _context.Messages
                .Where(m => m.GroupId == null && m.SenderId == userId)
                .OrderByDescending(m => m.MessageSent)
                .FirstOrDefaultAsync();

            return message;
        }

    }
}