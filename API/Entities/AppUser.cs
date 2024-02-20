using API.Extensions;
using Microsoft.AspNetCore.Identity;
using System;
using System.Collections.Generic;
using System.Text.Json.Serialization;

namespace API.Entities
{
    public class AppUser : IdentityUser<int>
    {
        public DateOnly DateOfBirth { get; set; }
        public DateTime Created { get; set; } = DateTime.UtcNow;
        public DateTime LastActive { get; set; } = DateTime.UtcNow;
        public string Introduction { get; set; }
        public Photo Photo { get; set; }
        public List<Message> MessagesSent { get; set; }
        public List<Message> MessagesReceived { get; set; }
        public ICollection<AppUserRole> UserRoles { get; set; }
        [JsonIgnore]
        public ICollection<FriendRequest> FriendRequestsSent { get; set; }
        [JsonIgnore]
        public ICollection<FriendRequest> FriendRequestsReceived { get; set; }
        public ICollection<Group> Groups { get; set; }
        public ICollection<UserGroup> UserGroups { get; set; }
    }
}