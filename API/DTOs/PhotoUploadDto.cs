using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace API.DTOs
{
    public class PhotoUploadDto
    {
        public IFormFile File { get; set; }
    }
}