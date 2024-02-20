using API.DTOs;
using API.Entities;
using API.Extensions;
using AutoMapper;

namespace API.Helpers
{
    public class AutoMapperProfiles : Profile
    {
        public AutoMapperProfiles()
        {
            CreateMap<AppUser, MemberDto>()
                .ForMember(dest => dest.PhotoUrl, opt => opt.MapFrom(src => src.Photo != null ? src.Photo.Url : null))
                .ForMember(dest => dest.Age, opt => opt.MapFrom(src => src.DateOfBirth.CalculateAge()));

            CreateMap<AppUser, UserDto>();
            CreateMap<CreateGroupDto, Group>()
                .ForMember(dest => dest.Name, opt => opt.MapFrom(src => src.Name));
            CreateMap<Group, GroupDto>()
                .ForMember(dest => dest.Owner, opt => opt.MapFrom(src => src.AppUserId))
                .ForMember(dest => dest.PhotoUrl, opt => opt.MapFrom(src => src.PhotoUrl));
            CreateMap<Message, GroupMessageDto>()
                .ForMember(d => d.SenderUsername, o => o.MapFrom(s => s.Sender.UserName))
                .ForMember(d => d.GroupId, o => o.MapFrom(s => s.Group.GroupId));

            CreateMap<UserGroup, UserGroupDto>()
                    .ForMember(dest => dest.GroupId, opt => opt.MapFrom(src => src.GroupId))
                    .ForMember(dest => dest.Members, opt => opt.Ignore());

            CreateMap<GroupMessageDto, Message>();
            CreateMap<Message, MessageDto>()
                .ForMember(d => d.SenderPhotoUrl, o => o.MapFrom(s => s.Sender.Photo.Url))
                .ForMember(d => d.RecipientPhotoUrl, o => o.MapFrom(s => s.Recipient.Photo.Url));
            CreateMap<Message, MessageDto>()
                .ForMember(d => d.RecipientPhotoUrl, o => o.MapFrom(s => s.Recipient.Photo.Url ?? "https://res.cloudinary.com/dvo6rzso4/image/upload/v1685649606/user_cacfl3.png"));

            CreateMap<Photo, PhotoDto>();
            CreateMap<MemberUpdateDto, AppUser>();
            CreateMap<RegisterDto, AppUser>();
            CreateMap<Message, MessageDto>()
                .ForMember(d => d.SenderPhotoUrl, o => o.MapFrom(s => s.Sender.Photo.Url))
                .ForMember(d => d.RecipientPhotoUrl, o => o.MapFrom(s => s.Recipient.Photo.Url));
            CreateMap<DateTime, DateTime>().ConvertUsing(d => DateTime.SpecifyKind(d, DateTimeKind.Utc));
            CreateMap<DateTime?, DateTime?>().ConvertUsing(d => d.HasValue ?
                DateTime.SpecifyKind(d.Value, DateTimeKind.Utc) : null);
        }
    }
}