using System.ComponentModel.DataAnnotations;
using Microsoft.AspNetCore.Mvc.RazorPages.Infrastructure;

namespace API.DTOs
{
    public class RegisterDto
    {
        [Required]
        public string Username { get; set; }

        //[Required] public string KnownAs { get; set; }
        // [Required] public string Gender { get; set; }
        [Required] public DateOnly? DateOfBirth { get; set; } // optional to make required work!
                                                              // [Required] public string City { get; set; }
                                                              // [Required] public string Country { get; set; }

        [Required]
        public string Email { get; set; }

        [Required]
        public String PhoneNumber { get; set; }

        [Required]
        [StringLength(40, MinimumLength = 4)]


        public string Password { get; set; }
    }
}