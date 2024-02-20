using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace API.DTOs
{
    public class GroupMessageDto
    {
        public string SenderUsername { get; set; }
        public int GroupId { get; set; }
        public string Content { get; set; }
        //public DateTime? DateRead { get; set; }
        //public DateTime MessageSent { get; set; }
    }
}