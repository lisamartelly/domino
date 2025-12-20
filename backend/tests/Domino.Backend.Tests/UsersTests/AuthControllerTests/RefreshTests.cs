#pragma warning disable IDE0058 // Expression value is never used

using Domino.Backend.Application.Users;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Moq;

namespace Domino.Backend.Tests.UsersTests.AuthControllerTests;

public class RefreshTests : AuthControllerTestsBase
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

    private void SetupRequestCookies(Dictionary<string, string> cookies)
    {
        var mockCookies = new Mock<IRequestCookieCollection>();

        foreach (var cookie in cookies)
        {
            mockCookies.Setup(x => x[cookie.Key]).Returns(cookie.Value);
        }

        // Return null for keys not in the dictionary
        mockCookies.Setup(x => x[It.IsNotIn(cookies.Keys.ToArray())]).Returns((string?)null);

        AuthController.HttpContext.Request.Cookies = mockCookies.Object;
    }

    [Test]
    public async Task WithNoRefreshToken_ReturnsUnauthorized()
    {
        // Arrange - no cookies or headers set

        // Act
        var result = await AuthController.Refresh();

        // Assert
        using (Assert.EnterMultipleScope())
        {
            Assert.That(result, Is.TypeOf<UnauthorizedObjectResult>(), "Expected result to be UnauthorizedObjectResult");
            var unauthorizedResult = result as UnauthorizedObjectResult;
            Assert.That(unauthorizedResult!.Value?.ToString(), Does.Contain("Refresh token not found"), "Expected refresh token not found message");
        }
    }

    [Test]
    public async Task WithValidRefreshTokenInCookie_ReturnsOkAndRotatesTokens()
    {
        // Arrange
        var refreshToken = "valid-refresh-token";
        SetupRequestCookies(new Dictionary<string, string> { { "refreshToken", refreshToken } });

        RefreshTokenServiceMock
            .Setup(x => x.ValidateRefreshTokenAsync(refreshToken, null))
            .ReturnsAsync((true, _testUser, "token-family-123"));

        RefreshTokenServiceMock
            .Setup(x => x.GenerateRefreshToken())
            .Returns("new-refresh-token");

        RefreshTokenServiceMock
            .Setup(x => x.StoreRefreshTokenAsync(It.IsAny<UserModel>(), It.IsAny<string>(), It.IsAny<DateTime>(), It.IsAny<string?>()))
            .Returns(Task.CompletedTask);

        RefreshTokenServiceMock
            .Setup(x => x.RevokeRefreshTokenAsync(It.IsAny<UserModel>()))
            .Returns(Task.CompletedTask);

        // Act
        var result = await AuthController.Refresh();

        // Assert
        using (Assert.EnterMultipleScope())
        {
            Assert.That(result, Is.TypeOf<OkObjectResult>(), "Expected result to be OkObjectResult");
            var okResult = result as OkObjectResult;
            Assert.That(okResult!.Value?.ToString(), Does.Contain("Token refreshed successfully"), "Expected success message");
        }

        RefreshTokenServiceMock.Verify(
            x => x.StoreRefreshTokenAsync(_testUser, "new-refresh-token", It.IsAny<DateTime>(), "token-family-123"),
            Times.Once,
            "Expected new refresh token to be stored with same family ID"
        );

        RefreshTokenServiceMock.Verify(
            x => x.RevokeRefreshTokenAsync(_testUser),
            Times.Once,
            "Expected old refresh token to be revoked"
        );
    }

    [Test]
    public async Task WithValidRefreshTokenInHeader_ReturnsOkAndRotatesTokens()
    {
        // Arrange
        var refreshToken = "valid-refresh-token-from-header";
        AuthController.HttpContext.Request.Headers.Authorization = $"Bearer {refreshToken}";

        RefreshTokenServiceMock
            .Setup(x => x.ValidateRefreshTokenAsync(refreshToken, null))
            .ReturnsAsync((true, _testUser, "token-family-456"));

        RefreshTokenServiceMock
            .Setup(x => x.GenerateRefreshToken())
            .Returns("new-refresh-token");

        RefreshTokenServiceMock
            .Setup(x => x.StoreRefreshTokenAsync(It.IsAny<UserModel>(), It.IsAny<string>(), It.IsAny<DateTime>(), It.IsAny<string?>()))
            .Returns(Task.CompletedTask);

        RefreshTokenServiceMock
            .Setup(x => x.RevokeRefreshTokenAsync(It.IsAny<UserModel>()))
            .Returns(Task.CompletedTask);

        // Act
        var result = await AuthController.Refresh();

        // Assert
        Assert.That(result, Is.TypeOf<OkObjectResult>(), "Expected result to be OkObjectResult");

        RefreshTokenServiceMock.Verify(
            x => x.ValidateRefreshTokenAsync(refreshToken, null),
            Times.Once,
            "Expected refresh token from header to be validated"
        );
    }

    [Test]
    public async Task WithInvalidRefreshToken_ReturnsUnauthorized()
    {
        // Arrange
        var refreshToken = "invalid-refresh-token";
        SetupRequestCookies(new Dictionary<string, string> { { "refreshToken", refreshToken } });

        RefreshTokenServiceMock
            .Setup(x => x.ValidateRefreshTokenAsync(refreshToken, null))
            .ReturnsAsync((false, null, null));

        // Act
        var result = await AuthController.Refresh();

        // Assert
        using (Assert.EnterMultipleScope())
        {
            Assert.That(result, Is.TypeOf<UnauthorizedObjectResult>(), "Expected result to be UnauthorizedObjectResult");
            var unauthorizedResult = result as UnauthorizedObjectResult;
            Assert.That(unauthorizedResult!.Value?.ToString(), Does.Contain("Invalid or expired refresh token"), "Expected invalid token message");
        }

        RefreshTokenServiceMock.Verify(
            x => x.GenerateRefreshToken(),
            Times.Never,
            "Expected no new token generation for invalid token"
        );
    }

    [Test]
    public async Task WithExpiredRefreshToken_ReturnsUnauthorized()
    {
        // Arrange
        var refreshToken = "expired-refresh-token";
        SetupRequestCookies(new Dictionary<string, string> { { "refreshToken", refreshToken } });

        RefreshTokenServiceMock
            .Setup(x => x.ValidateRefreshTokenAsync(refreshToken, null))
            .ReturnsAsync((false, null, null));

        // Act
        var result = await AuthController.Refresh();

        // Assert
        Assert.That(result, Is.TypeOf<UnauthorizedObjectResult>(), "Expected result to be UnauthorizedObjectResult");
    }

    [Test]
    public async Task WithInactiveUser_ReturnsUnauthorizedAndRevokesToken()
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

        var refreshToken = "valid-refresh-token";
        SetupRequestCookies(new Dictionary<string, string> { { "refreshToken", refreshToken } });

        RefreshTokenServiceMock
            .Setup(x => x.ValidateRefreshTokenAsync(refreshToken, null))
            .ReturnsAsync((true, inactiveUser, "token-family-789"));

        RefreshTokenServiceMock
            .Setup(x => x.RevokeRefreshTokenAsync(It.IsAny<UserModel>()))
            .Returns(Task.CompletedTask);

        // Act
        var result = await AuthController.Refresh();

        // Assert
        using (Assert.EnterMultipleScope())
        {
            Assert.That(result, Is.TypeOf<UnauthorizedObjectResult>(), "Expected result to be UnauthorizedObjectResult");
            var unauthorizedResult = result as UnauthorizedObjectResult;
            Assert.That(unauthorizedResult!.Value?.ToString(), Does.Contain("Account is inactive"), "Expected inactive account message");
        }

        RefreshTokenServiceMock.Verify(
            x => x.RevokeRefreshTokenAsync(inactiveUser),
            Times.Once,
            "Expected refresh token to be revoked for inactive user"
        );

        RefreshTokenServiceMock.Verify(
            x => x.GenerateRefreshToken(),
            Times.Never,
            "Expected no new token generation for inactive user"
        );
    }

    [Test]
    public async Task WithValidRefresh_SetsCookies()
    {
        // Arrange
        var refreshToken = "valid-refresh-token";
        SetupRequestCookies(new Dictionary<string, string> { { "refreshToken", refreshToken } });

        RefreshTokenServiceMock
            .Setup(x => x.ValidateRefreshTokenAsync(refreshToken, null))
            .ReturnsAsync((true, _testUser, "token-family-123"));

        RefreshTokenServiceMock
            .Setup(x => x.GenerateRefreshToken())
            .Returns("new-refresh-token");

        RefreshTokenServiceMock
            .Setup(x => x.StoreRefreshTokenAsync(It.IsAny<UserModel>(), It.IsAny<string>(), It.IsAny<DateTime>(), It.IsAny<string?>()))
            .Returns(Task.CompletedTask);

        RefreshTokenServiceMock
            .Setup(x => x.RevokeRefreshTokenAsync(It.IsAny<UserModel>()))
            .Returns(Task.CompletedTask);

        // Act
        var result = await AuthController.Refresh();

        // Assert
        Assert.That(result, Is.TypeOf<OkObjectResult>(), "Expected successful refresh");

        var cookies = AuthController.HttpContext.Response.Headers.SetCookie.ToString();
        using (Assert.EnterMultipleScope())
        {
            Assert.That(cookies, Does.Contain("accessToken"), "Expected accessToken cookie to be set");
            Assert.That(cookies, Does.Contain("refreshToken"), "Expected refreshToken cookie to be set");
        }
    }

    [Test]
    public async Task WithValidRefresh_PreservesTokenFamilyId()
    {
        // Arrange
        var refreshToken = "valid-refresh-token";
        var tokenFamilyId = "preserved-family-id";

        SetupRequestCookies(new Dictionary<string, string> { { "refreshToken", refreshToken } });

        RefreshTokenServiceMock
            .Setup(x => x.ValidateRefreshTokenAsync(refreshToken, null))
            .ReturnsAsync((true, _testUser, tokenFamilyId));

        RefreshTokenServiceMock
            .Setup(x => x.GenerateRefreshToken())
            .Returns("new-refresh-token");

        RefreshTokenServiceMock
            .Setup(x => x.StoreRefreshTokenAsync(It.IsAny<UserModel>(), It.IsAny<string>(), It.IsAny<DateTime>(), It.IsAny<string?>()))
            .Returns(Task.CompletedTask);

        RefreshTokenServiceMock
            .Setup(x => x.RevokeRefreshTokenAsync(It.IsAny<UserModel>()))
            .Returns(Task.CompletedTask);

        // Act
        await AuthController.Refresh();

        // Assert
        RefreshTokenServiceMock.Verify(
            x => x.StoreRefreshTokenAsync(_testUser, "new-refresh-token", It.IsAny<DateTime>(), tokenFamilyId),
            Times.Once,
            "Expected token family ID to be preserved during rotation"
        );
    }

    [Test]
    public async Task CookieTakesPrecedenceOverHeader()
    {
        // Arrange
        var cookieToken = "cookie-refresh-token";
        var headerToken = "header-refresh-token";

        SetupRequestCookies(new Dictionary<string, string> { { "refreshToken", cookieToken } });
        AuthController.HttpContext.Request.Headers.Authorization = $"Bearer {headerToken}";

        RefreshTokenServiceMock
            .Setup(x => x.ValidateRefreshTokenAsync(cookieToken, null))
            .ReturnsAsync((true, _testUser, "token-family"));

        RefreshTokenServiceMock
            .Setup(x => x.GenerateRefreshToken())
            .Returns("new-refresh-token");

        RefreshTokenServiceMock
            .Setup(x => x.StoreRefreshTokenAsync(It.IsAny<UserModel>(), It.IsAny<string>(), It.IsAny<DateTime>(), It.IsAny<string?>()))
            .Returns(Task.CompletedTask);

        RefreshTokenServiceMock
            .Setup(x => x.RevokeRefreshTokenAsync(It.IsAny<UserModel>()))
            .Returns(Task.CompletedTask);

        // Act
        await AuthController.Refresh();

        // Assert
        RefreshTokenServiceMock.Verify(
            x => x.ValidateRefreshTokenAsync(cookieToken, null),
            Times.Once,
            "Expected cookie token to be used"
        );

        RefreshTokenServiceMock.Verify(
            x => x.ValidateRefreshTokenAsync(headerToken, null),
            Times.Never,
            "Expected header token to be ignored when cookie is present"
        );
    }
}
