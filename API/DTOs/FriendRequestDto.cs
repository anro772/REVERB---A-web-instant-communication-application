using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace API.DTOs
{
    public class FriendRequestDto
    {
        public int FriendRequestId { get; set; }
        public string RequesterUsername { get; set; }
        public string RequestedUsername { get; set; }
        public bool Accepted { get; set; }
        public bool Handled { get; set; }
        public string Type{ get; set;}
    }
}