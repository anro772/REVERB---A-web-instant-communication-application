using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace API.DTOs
{
    public class InviteUserToGroupDto
    {
        public int UserId { get; set; }
        public int GroupId { get; set; }
    }
}