using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace API.Entities
{
    public class UserGroup
    {
        public int AppUserId { get; set; }
        public AppUser AppUser { get; set; }
        public int GroupId { get; set; }
        public Group Group { get; set; }
        public bool IsOwner { get; set; }
        public bool Accepted { get; set; }
        public bool Handled { get; set; }
    }
}