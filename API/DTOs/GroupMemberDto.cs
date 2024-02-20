using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace API.DTOs
{
    public class GroupMemberDto
    {
        public int UserId { get; set; }
        public int GroupId { get; set; }
        public bool IsOwner { get; set; }
        public bool Accepted { get; set; }
        public bool Handled { get; set; }
        public string Type { get; set; }
    }
}