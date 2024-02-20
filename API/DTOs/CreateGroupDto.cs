using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace API.DTOs
{
    public class CreateGroupDto
    {
        public String Name { get; set; }
        public IFormFile Photo { get; set; }
        public int GroupId { get; set; }
    }
}