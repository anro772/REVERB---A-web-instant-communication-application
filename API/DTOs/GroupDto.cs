using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace API.DTOs
{
    public class GroupDto
    {
        public String Name { get; set; }
        public int GroupId { get; set; }
        public int Owner { get; set; }
        //public IEnumerable<UserDto> Members { get; set; }
        public String PhotoUrl { get; set; }
    }
}