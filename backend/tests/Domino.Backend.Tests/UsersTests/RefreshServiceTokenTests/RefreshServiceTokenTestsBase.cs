#pragma warning disable CS8618 // Non-nullable field must contain a non-null value when exiting constructor

using Domino.Backend.Application.Users;
using Microsoft.AspNetCore.Identity;
using Moq;

namespace Domino.Backend.Tests.UsersTests.RefreshServiceTokenTests;

[TestFixture]
public abstract class RefreshTokenServiceTestBase
{
    protected Mock<UserManager<UserModel>> UserManagerMock;
    protected RefreshTokenService RefreshTokenService;

    [SetUp]
    public void SetUp()
    {
        UserManagerMock = SetupUserManagerMock();
        RefreshTokenService = new RefreshTokenService(UserManagerMock.Object);
    }

    protected virtual Mock<UserManager<UserModel>> SetupUserManagerMock()
    {
        var store = new Mock<IUserStore<UserModel>>();
        return new Mock<UserManager<UserModel>>(
            store.Object,
            null!,
            null!,
            null!,
            null!,
            null!,
            null!,
            null!,
            null!
        );
    }
}
