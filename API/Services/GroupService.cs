using System;
using System.Linq;
using API.Entities;
using API.Data;
using API.Interfaces;

namespace API.Services
{
    public class GroupService : IGroupService
    {
        private readonly DataContext _context;
        private readonly IPhotoService _photoService;

        public GroupService(DataContext context, IPhotoService photoService)
        {
            _context = context;
            _photoService = photoService;
        }

        public Group CreateGroup(int appUserId, string groupName, IFormFile photo)
        {
            // Check if user exists
            var userExists = _context.Users.Any(u => u.Id == appUserId);
            if (!userExists)
            {
                throw new Exception($"User with ID {appUserId} does not exist");
            }

            // Check if group with the same name already exists
            var groupExists = _context.Groups.Any(g => g.Name == groupName);
            if (groupExists)
            {
                throw new Exception($"Group with name {groupName} already exists");
            }
            var photoUrl = "";

            // Upload photo and get URL
            if (photo != null)
            {
                var uploadResult = _photoService.AddPhotoAsync(photo).Result;
                photoUrl = uploadResult?.SecureUrl.ToString();
            }
            //if photo is null, create a photo from this url https://res.cloudinary.com/dvo6rzso4/image/upload/v1685621487/gphoto_l5ar6i.jpg
            if (photo == null)
            {
                IFormFile newFile = new FormFile(new MemoryStream(), 0, 0, "photo", "https://res.cloudinary.com/dvo6rzso4/image/upload/v1685621487/gphoto_l5ar6i.jpg");
                photoUrl = "https://res.cloudinary.com/dvo6rzso4/image/upload/v1685621487/gphoto_l5ar6i.jpg";
            }

            var group = new Group { Name = groupName, AppUserId = appUserId, PhotoUrl = photoUrl };


            // Create user-group relationship
            var userGroup = new UserGroup
            {
                AppUserId = appUserId,
                Group = group,
                IsOwner = true,
                Accepted = true,
                Handled = true
            };

            _context.UserGroups.Add(userGroup);

            // Save changes to the database
            _context.SaveChanges();

            return group;
        }

    }
}
