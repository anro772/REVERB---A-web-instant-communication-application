namespace API.Interfaces
{
    public interface IUnitOfWork
    {
        IUserRepository UserRepository { get; }
        IMessageRepository MessageRepository { get; }
        IFriendRequestRepository FriendRequestRepository { get; }
        IUserGroupRepository UserGroupRepository { get; }
        Task<bool> Complete();
        bool HasChanges();
    }
}