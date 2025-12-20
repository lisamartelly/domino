#pragma warning disable IDE0058 // Expression value is never used

using System.Security.Claims;
using Domino.Backend.Application.Users;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Moq;

namespace Domino.Backend.Tests.UsersTests.AuthControllerTests;

public class GetCurrentUserTests : AuthControllerTestsBase
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

    private void SetupAuthenticatedUser(string? userId = null, bool isAuthenticated = true)
    {
        var claims = new List<Claim>();
        if (!string.IsNullOrEmpty(userId))
        {
            claims.Add(new Claim(ClaimTypes.NameIdentifier, userId));
        }

        var identity = new ClaimsIdentity(claims, isAuthenticated ? "TestAuth" : null);
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
    public async Task WithAuthenticatedUser_ReturnsUserData()
    {
        // Arrange
        SetupAuthenticatedUser(_testUser.Id);

        UserManagerMock
            .Setup(x => x.FindByIdAsync(_testUser.Id))
            .ReturnsAsync(_testUser);

        // Act
        var result = await AuthController.GetCurrentUser();

        // Assert
        using (Assert.EnterMultipleScope())
        {
            Assert.That(result, Is.TypeOf<OkObjectResult>(), "Expected result to be OkObjectResult");
            var okResult = result as OkObjectResult;
            var userDto = okResult!.Value as UserDto;
            Assert.That(userDto, Is.Not.Null, "Expected UserDto in response");
            Assert.That(userDto!.Id, Is.EqualTo(_testUser.Id), "Expected user ID to match");
            Assert.That(userDto.Email, Is.EqualTo(_testUser.Email), "Expected email to match");
            Assert.That(userDto.FirstName, Is.EqualTo(_testUser.FirstName), "Expected first name to match");
            Assert.That(userDto.LastName, Is.EqualTo(_testUser.LastName), "Expected last name to match");
        }
    }

    [Test]
    public async Task WithAuthenticatedUserButMissingUserId_ReturnsUnauthorized()
    {
        // Arrange - authenticated but no NameIdentifier claim
        SetupAuthenticatedUser(userId: null, isAuthenticated: true);

        // Act
        var result = await AuthController.GetCurrentUser();

        // Assert
        using (Assert.EnterMultipleScope())
        {
            Assert.That(result, Is.TypeOf<UnauthorizedObjectResult>(), "Expected result to be UnauthorizedObjectResult");
            var unauthorizedResult = result as UnauthorizedObjectResult;
            Assert.That(unauthorizedResult!.Value?.ToString(), Does.Contain("Invalid token"), "Expected invalid token message");
        }
    }

    [Test]
    public async Task WithAuthenticatedUserNotFound_ReturnsUnauthorized()
    {
        // Arrange
        SetupAuthenticatedUser("nonexistent-user-id");

        UserManagerMock
            .Setup(x => x.FindByIdAsync("nonexistent-user-id"))
            .ReturnsAsync((UserModel?)null);

        // Act
        var result = await AuthController.GetCurrentUser();

        // Assert
        using (Assert.EnterMultipleScope())
        {
            Assert.That(result, Is.TypeOf<UnauthorizedObjectResult>(), "Expected result to be UnauthorizedObjectResult");
            var unauthorizedResult = result as UnauthorizedObjectResult;
            Assert.That(unauthorizedResult!.Value?.ToString(), Does.Contain("User not found or inactive"), "Expected user not found message");
        }
    }

    [Test]
    public async Task WithAuthenticatedButInactiveUser_ReturnsUnauthorized()
    {
        // Arrange
        var inactiveUser = new UserModel
        {
            Id = "user-inactive",
            Email = "inactive@example.com",
            UserName = "inactive@example.com",
            FirstName = "Inactive",
            LastName = "User",
            IsActive = false
        };

        SetupAuthenticatedUser(inactiveUser.Id);

        UserManagerMock
            .Setup(x => x.FindByIdAsync(inactiveUser.Id))
            .ReturnsAsync(inactiveUser);

        // Act
        var result = await AuthController.GetCurrentUser();

        // Assert
        using (Assert.EnterMultipleScope())
        {
            Assert.That(result, Is.TypeOf<UnauthorizedObjectResult>(), "Expected result to be UnauthorizedObjectResult");
            var unauthorizedResult = result as UnauthorizedObjectResult;
            Assert.That(unauthorizedResult!.Value?.ToString(), Does.Contain("User not found or inactive"), "Expected inactive user message");
        }
    }

    [Test]
    public async Task WithNoAuthButValidRefreshToken_ReturnsUserDataAndSetsAccessToken()
    {
        // Arrange - not authenticated
        SetupAuthenticatedUser(isAuthenticated: false);

        var refreshToken = "valid-refresh-token";
        SetupRequestCookies(new Dictionary<string, string> { { "refreshToken", refreshToken } });

        RefreshTokenServiceMock
            .Setup(x => x.ValidateRefreshTokenAsync(refreshToken, null))
            .ReturnsAsync((true, _testUser, "token-family"));

        // Act
        var result = await AuthController.GetCurrentUser();

        // Assert
        using (Assert.EnterMultipleScope())
        {
            Assert.That(result, Is.TypeOf<OkObjectResult>(), "Expected result to be OkObjectResult");
            var okResult = result as OkObjectResult;
            var userDto = okResult!.Value as UserDto;
            Assert.That(userDto, Is.Not.Null, "Expected UserDto in response");
            Assert.That(userDto!.Id, Is.EqualTo(_testUser.Id), "Expected user ID to match");
        }

        // Verify new access token cookie is set
        var cookies = AuthController.HttpContext.Response.Headers.SetCookie.ToString();
        Assert.That(cookies, Does.Contain("accessToken"), "Expected new accessToken cookie to be set");
    }

    [Test]
    public async Task WithNoAuthButValidRefreshTokenForInactiveUser_ReturnsUnauthorized()
    {
        // Arrange - not authenticated
        SetupAuthenticatedUser(isAuthenticated: false);

        var inactiveUser = new UserModel
        {
            Id = "user-inactive",
            Email = "inactive@example.com",
            UserName = "inactive@example.com",
            FirstName = "Inactive",
            LastName = "User",
            IsActive = false
        };

        var refreshToken = "valid-refresh-token";
        SetupRequestCookies(new Dictionary<string, string> { { "refreshToken", refreshToken } });

        RefreshTokenServiceMock
            .Setup(x => x.ValidateRefreshTokenAsync(refreshToken, null))
            .ReturnsAsync((true, inactiveUser, "token-family"));

        // Act
        var result = await AuthController.GetCurrentUser();

        // Assert
        using (Assert.EnterMultipleScope())
        {
            Assert.That(result, Is.TypeOf<UnauthorizedObjectResult>(), "Expected result to be UnauthorizedObjectResult");
            var unauthorizedResult = result as UnauthorizedObjectResult;
            Assert.That(unauthorizedResult!.Value?.ToString(), Does.Contain("Not authenticated"), "Expected not authenticated message");
        }
    }

    [Test]
    public async Task WithNoAuthAndInvalidRefreshToken_ReturnsUnauthorized()
    {
        // Arrange - not authenticated
        SetupAuthenticatedUser(isAuthenticated: false);

        var refreshToken = "invalid-refresh-token";
        SetupRequestCookies(new Dictionary<string, string> { { "refreshToken", refreshToken } });

        RefreshTokenServiceMock
            .Setup(x => x.ValidateRefreshTokenAsync(refreshToken, null))
            .ReturnsAsync((false, null, null));

        // Act
        var result = await AuthController.GetCurrentUser();

        // Assert
        using (Assert.EnterMultipleScope())
        {
            Assert.That(result, Is.TypeOf<UnauthorizedObjectResult>(), "Expected result to be UnauthorizedObjectResult");
            var unauthorizedResult = result as UnauthorizedObjectResult;
            Assert.That(unauthorizedResult!.Value?.ToString(), Does.Contain("Not authenticated"), "Expected not authenticated message");
        }
    }

    [Test]
    public async Task WithNoAuthAndNoRefreshToken_ReturnsUnauthorized()
    {
        // Arrange - not authenticated, no cookies
        SetupAuthenticatedUser(isAuthenticated: false);

        // Act
        var result = await AuthController.GetCurrentUser();

        // Assert
        using (Assert.EnterMultipleScope())
        {
            Assert.That(result, Is.TypeOf<UnauthorizedObjectResult>(), "Expected result to be UnauthorizedObjectResult");
            var unauthorizedResult = result as UnauthorizedObjectResult;
            Assert.That(unauthorizedResult!.Value?.ToString(), Does.Contain("Not authenticated"), "Expected not authenticated message");
        }
    }

    [Test]
    public async Task WithUnexpectedException_ReturnsInternalServerError()
    {
        // Arrange
        SetupAuthenticatedUser(_testUser.Id);

        UserManagerMock
            .Setup(x => x.FindByIdAsync(_testUser.Id))
            .ThrowsAsync(new Exception("Database connection failed"));

        // Act
        var result = await AuthController.GetCurrentUser();

        // Assert
        using (Assert.EnterMultipleScope())
        {
            Assert.That(result, Is.TypeOf<ObjectResult>(), "Expected result to be ObjectResult");
            var objectResult = result as ObjectResult;
            Assert.That(objectResult!.StatusCode, Is.EqualTo(500), "Expected status code 500");
            Assert.That(objectResult.Value?.ToString(), Does.Contain("error occurred"), "Expected error message");
        }
    }
}
