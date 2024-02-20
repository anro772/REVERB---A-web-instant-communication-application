using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace API.Entities
{
    public class FriendRequest
    {
        public int FriendRequestId { get; set; }
        public int RequesterId { get; set; }
        public AppUser Requester { get; set; }
        public int RequestedId { get; set; }
        public AppUser Requested { get; set; }
        public bool Accepted { get; set; } = false;
        public bool Handled { get; set; } = false;
    }
}