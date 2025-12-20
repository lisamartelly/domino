#pragma warning disable IDE0058 // Expression value is never used

using System.Security.Claims;
using Domino.Backend.Application.Users;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Moq;

namespace Domino.Backend.Tests.UsersTests.AuthControllerTests;

public class LogoutTests : AuthControllerTestsBase
{
    private UserModel _testUser = null!;

    [SetUp]
    public new void SetUp()
    {
        base.SetUp();

        _testUser = new UserModel
        {
            Id = "user-123",
            Email = "test@example.com",
            UserName = "test@example.com",
            FirstName = "John",
            LastName = "Doe",
            IsActive = true
        };
    }

    private void SetupAuthenticatedUser(string userId)
    {
        var claims = new List<Claim>
        {
            new(ClaimTypes.NameIdentifier, userId)
        };
        var identity = new ClaimsIdentity(claims, "TestAuth");
        var claimsPrincipal = new ClaimsPrincipal(identity);

        AuthController.ControllerContext.HttpContext.User = claimsPrincipal;
    }

    private void SetupRequestCookies(Dictionary<string, string> cookies)
    {
        var mockCookies = new Mock<IRequestCookieCollection>();

        foreach (var cookie in cookies)
        {
            mockCookies.Setup(x => x[cookie.Key]).Returns(cookie.Value);
        }

        mockCookies.Setup(x => x[It.IsNotIn(cookies.Keys.ToArray())]).Returns((string?)null);

        AuthController.HttpContext.Request.Cookies = mockCookies.Object;
    }

    [Test]
    public async Task WithAuthenticatedUser_RevokesTokenAndReturnsOk()
    {
        // Arrange
        SetupAuthenticatedUser(_testUser.Id);

        UserManagerMock
            .Setup(x => x.FindByIdAsync(_testUser.Id))
            .ReturnsAsync(_testUser);

        RefreshTokenServiceMock
            .Setup(x => x.RevokeRefreshTokenAsync(It.IsAny<UserModel>()))
            .Returns(Task.CompletedTask);

        // Act
        var result = await AuthController.Logout();

        // Assert
        using (Assert.EnterMultipleScope())
        {
            Assert.That(result, Is.TypeOf<OkObjectResult>(), "Expected result to be OkObjectResult");
            var okResult = result as OkObjectResult;
            Assert.That(okResult!.Value?.ToString(), Does.Contain("Logout successful"), "Expected success message");
        }

        RefreshTokenServiceMock.Verify(
            x => x.RevokeRefreshTokenAsync(_testUser),
            Times.Once,
            "Expected refresh token to be revoked for authenticated user"
        );
    }

    [Test]
    public async Task WithAuthenticatedUserNotFound_StillReturnsOk()
    {
        // Arrange
        SetupAuthenticatedUser("nonexistent-user-id");

        UserManagerMock
            .Setup(x => x.FindByIdAsync("nonexistent-user-id"))
            .ReturnsAsync((UserModel?)null);

        // Act
        var result = await AuthController.Logout();

        // Assert
        Assert.That(result, Is.TypeOf<OkObjectResult>(), "Expected result to be OkObjectResult");

        RefreshTokenServiceMock.Verify(
            x => x.RevokeRefreshTokenAsync(It.IsAny<UserModel>()),
            Times.Never,
            "Expected no token revocation for nonexistent user"
        );
    }

    [Test]
    public async Task WithNoAuthButValidRefreshTokenInCookie_RevokesTokenAndReturnsOk()
    {
        // Arrange
        var refreshToken = "valid-refresh-token";
        SetupRequestCookies(new Dictionary<string, string> { { "refreshToken", refreshToken } });

        RefreshTokenServiceMock
            .Setup(x => x.ValidateRefreshTokenAsync(refreshToken, null))
            .ReturnsAsync((true, _testUser, "token-family"));

        RefreshTokenServiceMock
            .Setup(x => x.RevokeRefreshTokenAsync(It.IsAny<UserModel>()))
            .Returns(Task.CompletedTask);

        // Act
        var result = await AuthController.Logout();

        // Assert
        Assert.That(result, Is.TypeOf<OkObjectResult>(), "Expected result to be OkObjectResult");

        RefreshTokenServiceMock.Verify(
            x => x.RevokeRefreshTokenAsync(_testUser),
            Times.Once,
            "Expected refresh token to be revoked via cookie fallback"
        );
    }

    [Test]
    public async Task WithNoAuthAndInvalidRefreshToken_StillReturnsOk()
    {
        // Arrange
        var refreshToken = "invalid-refresh-token";
        SetupRequestCookies(new Dictionary<string, string> { { "refreshToken", refreshToken } });

        RefreshTokenServiceMock
            .Setup(x => x.ValidateRefreshTokenAsync(refreshToken, null))
            .ReturnsAsync((false, null, null));

        // Act
        var result = await AuthController.Logout();

        // Assert
        Assert.That(result, Is.TypeOf<OkObjectResult>(), "Expected result to be OkObjectResult (idempotent)");

        RefreshTokenServiceMock.Verify(
            x => x.RevokeRefreshTokenAsync(It.IsAny<UserModel>()),
            Times.Never,
            "Expected no token revocation for invalid token"
        );
    }

    [Test]
    public async Task WithNoAuthAndNoRefreshToken_StillReturnsOk()
    {
        // Arrange - no authentication, no cookies

        // Act
        var result = await AuthController.Logout();

        // Assert
        Assert.That(result, Is.TypeOf<OkObjectResult>(), "Expected result to be OkObjectResult (idempotent)");

        RefreshTokenServiceMock.Verify(
            x => x.RevokeRefreshTokenAsync(It.IsAny<UserModel>()),
            Times.Never,
            "Expected no token revocation when nothing to revoke"
        );

        RefreshTokenServiceMock.Verify(
            x => x.ValidateRefreshTokenAsync(It.IsAny<string>(), It.IsAny<string?>()),
            Times.Never,
            "Expected no token validation when no cookie present"
        );
    }

    [Test]
    public async Task AlwaysClearsCookies()
    {
        // Arrange
        SetupAuthenticatedUser(_testUser.Id);

        UserManagerMock
            .Setup(x => x.FindByIdAsync(_testUser.Id))
            .ReturnsAsync(_testUser);

        RefreshTokenServiceMock
            .Setup(x => x.RevokeRefreshTokenAsync(It.IsAny<UserModel>()))
            .Returns(Task.CompletedTask);

        // Act
        var result = await AuthController.Logout();

        // Assert
        Assert.That(result, Is.TypeOf<OkObjectResult>(), "Expected successful logout");

        var cookies = AuthController.HttpContext.Response.Headers.SetCookie.ToString();
        using (Assert.EnterMultipleScope())
        {
            Assert.That(cookies, Does.Contain("accessToken"), "Expected accessToken cookie to be cleared");
            Assert.That(cookies, Does.Contain("refreshToken"), "Expected refreshToken cookie to be cleared");
        }
    }

    [Test]
    public async Task IsIdempotent_MultipleCallsReturnOk()
    {
        // Arrange - no authentication, no cookies (already logged out state)

        // Act
        var result1 = await AuthController.Logout();
        var result2 = await AuthController.Logout();

        // Assert
        using (Assert.EnterMultipleScope())
        {
            Assert.That(result1, Is.TypeOf<OkObjectResult>(), "Expected first logout to succeed");
            Assert.That(result2, Is.TypeOf<OkObjectResult>(), "Expected second logout to succeed (idempotent)");
        }
    }

    [Test]
    public async Task AuthenticatedUserTakesPrecedenceOverCookie()
    {
        // Arrange - both authenticated user and cookie present
        SetupAuthenticatedUser(_testUser.Id);
        SetupRequestCookies(new Dictionary<string, string> { { "refreshToken", "some-token" } });

        UserManagerMock
            .Setup(x => x.FindByIdAsync(_testUser.Id))
            .ReturnsAsync(_testUser);

        RefreshTokenServiceMock
            .Setup(x => x.RevokeRefreshTokenAsync(It.IsAny<UserModel>()))
            .Returns(Task.CompletedTask);

        // Act
        await AuthController.Logout();

        // Assert - should use authenticated user path, not cookie path
        RefreshTokenServiceMock.Verify(
            x => x.RevokeRefreshTokenAsync(_testUser),
            Times.Once,
            "Expected token to be revoked via authenticated user"
        );

        RefreshTokenServiceMock.Verify(
            x => x.ValidateRefreshTokenAsync(It.IsAny<string>(), It.IsAny<string?>()),
            Times.Never,
            "Expected cookie validation to be skipped when user is authenticated"
        );
    }
}
