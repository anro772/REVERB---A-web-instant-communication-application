using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;

namespace API.Entities
{
    public class Group
    {
        public Group()
        {
        }

        public Group(string name)
        {
            Name = name;
        }

        [Key]
        public int GroupId { get; set; } // New GroupId property

        public int AppUserId { get; set; }
        public ICollection<UserGroup> UserGroups { get; set; }
        public string Name { get; set; }
        public ICollection<Connection> Connections { get; set; } = new List<Connection>();
        public string PhotoUrl { get; set; }
    }
}
