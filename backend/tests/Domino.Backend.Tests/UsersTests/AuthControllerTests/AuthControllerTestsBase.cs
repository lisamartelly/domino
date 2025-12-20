#pragma warning disable CS8618 // Non-nullable field must contain a non-null value when exiting constructor

using Domino.Backend.Application.Users;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Configuration;
using Moq;

namespace Domino.Backend.Tests.UsersTests.AuthControllerTests;

[TestFixture]
public abstract class AuthControllerTestsBase
{
    protected Mock<UserManager<UserModel>> UserManagerMock;
    protected Mock<IRefreshTokenService> RefreshTokenServiceMock;
    protected AuthController AuthController;

    [SetUp]
    public void SetUp()
    {
        UserManagerMock = SetupUserManagerMock();
        RefreshTokenServiceMock = new Mock<IRefreshTokenService>();

        var configValues = new Dictionary<string, string?>
        {
            ["JwtSettings:Issuer"] = "TestIssuer",
            ["JwtSettings:Audience"] = "TestAudience",
            ["JwtSettings:AccessTokenExpirationMinutes"] = "15",
            ["JwtSettings:RefreshTokenExpirationDays"] = "7",
            ["JwtSettings:SecretKey"] = "ThisIsAVeryLongSecretKeyForTestingPurposesOnly123!"
        };

        var configuration = new ConfigurationBuilder()
            .AddInMemoryCollection(configValues)
            .Build();

        AuthController = new AuthController(
            UserManagerMock.Object,
            RefreshTokenServiceMock.Object,
            configuration
        );
        // Setup HttpContext with Response.Cookies
        var httpContext = new DefaultHttpContext();
        AuthController.ControllerContext = new ControllerContext
        {
            HttpContext = httpContext
        };
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
