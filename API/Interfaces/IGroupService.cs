using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using API.Data;
using API.DTOs;
using API.Entities;
using API.Interfaces;
using AutoMapper;

namespace API.Interfaces
{
    public interface IGroupService
    {
        Group CreateGroup(int appUserId, string groupName, IFormFile photo);
    }
}