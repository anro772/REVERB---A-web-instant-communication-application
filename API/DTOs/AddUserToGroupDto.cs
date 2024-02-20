using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace API.DTOs
{
    public class AddUserToGroupDto
    {
        public int UserId { get; set; }
        public int GroupId { get; set; }
    }
}