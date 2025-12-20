#pragma warning disable IDE0058 // Expression value is never used

using Domino.Backend.Application.Users;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Configuration;
using Moq;

namespace Domino.Backend.Tests.UsersTests.AuthControllerTests;

public class LoginTests : AuthControllerTestsBase
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

    [Test]
    public async Task WithValidCredentials_ReturnsOkWithUserData()
    {
        // Arrange
        var request = new LoginRequest
        {
            Email = "test@example.com",
            Password = "Password123!"
        };

        UserManagerMock
            .Setup(x => x.FindByEmailAsync(request.Email))
            .ReturnsAsync(_testUser);

        UserManagerMock
            .Setup(x => x.IsLockedOutAsync(_testUser))
            .ReturnsAsync(false);

        UserManagerMock
            .Setup(x => x.CheckPasswordAsync(_testUser, request.Password))
            .ReturnsAsync(true);

        RefreshTokenServiceMock
            .Setup(x => x.GenerateRefreshToken())
            .Returns("mock-refresh-token");

        RefreshTokenServiceMock
            .Setup(x => x.StoreRefreshTokenAsync(It.IsAny<UserModel>(), It.IsAny<string>(), It.IsAny<DateTime>(), It.IsAny<string?>()))
            .Returns(Task.CompletedTask);

        // Act
        var result = await AuthController.Login(request);

        // Assert
        using (Assert.EnterMultipleScope())
        {
            Assert.That(result, Is.TypeOf<OkObjectResult>(), "Expected result to be OkObjectResult");
            var okResult = result as OkObjectResult;
            Assert.That(okResult!.Value, Is.Not.Null, "Expected value to not be null");
            var response = okResult.Value as LoginResponse;
            Assert.That(response!.Success, Is.True, "Expected success to be true");
            Assert.That(response.Message, Is.EqualTo("Login successful"), "Expected success message");
            Assert.That(response.User, Is.Not.Null, "Expected user to not be null");
            Assert.That(response.User!.Id, Is.EqualTo(_testUser.Id), "Expected user ID to match");
            Assert.That(response.User.Email, Is.EqualTo(_testUser.Email), "Expected user email to match");
            Assert.That(response.User.FirstName, Is.EqualTo(_testUser.FirstName), "Expected first name to match");
            Assert.That(response.User.LastName, Is.EqualTo(_testUser.LastName), "Expected last name to match");
        }

        RefreshTokenServiceMock.Verify(
            x => x.StoreRefreshTokenAsync(_testUser, "mock-refresh-token", It.IsAny<DateTime>(), It.IsAny<string?>()),
            Times.Once,
            "Expected refresh token to be stored"
        );
    }

    [Test]
    public async Task WithInvalidModelState_ReturnsBadRequest()
    {
        // Arrange
        var request = new LoginRequest
        {
            Email = "invalid",
            Password = ""
        };

        AuthController.ModelState.AddModelError("Email", "The Email field is not a valid e-mail address.");

        // Act
        var result = await AuthController.Login(request);

        // Assert
        using (Assert.EnterMultipleScope())
        {
            Assert.That(result, Is.TypeOf<BadRequestObjectResult>(), "Expected result to be BadRequestObjectResult");
            var badRequestResult = result as BadRequestObjectResult;
            Assert.That(badRequestResult!.Value, Is.Not.Null, "Expected value to not be null");
            var response = badRequestResult.Value as LoginResponse;
            Assert.That(response!.Success, Is.False, "Expected success to be false");
            Assert.That(response.Message, Is.EqualTo("Invalid email or password"), "Expected generic error message");
        }

        UserManagerMock.Verify(
            x => x.FindByEmailAsync(It.IsAny<string>()),
            Times.Never,
            "Expected FindByEmailAsync to not be called when model is invalid"
        );
    }

    [Test]
    public async Task WithNonExistentUser_ReturnsUnauthorized()
    {
        // Arrange
        var request = new LoginRequest
        {
            Email = "nonexistent@example.com",
            Password = "Password123!"
        };

        UserManagerMock
            .Setup(x => x.FindByEmailAsync(request.Email))
            .ReturnsAsync((UserModel?)null);

        // Act
        var result = await AuthController.Login(request);

        // Assert
        using (Assert.EnterMultipleScope())
        {
            Assert.That(result, Is.TypeOf<UnauthorizedObjectResult>(), "Expected result to be UnauthorizedObjectResult");
            var unauthorizedResult = result as UnauthorizedObjectResult;
            Assert.That(unauthorizedResult!.Value, Is.Not.Null, "Expected value to not be null");
            var response = unauthorizedResult.Value as LoginResponse;
            Assert.That(response!.Success, Is.False, "Expected success to be false");
            Assert.That(response.Message, Is.EqualTo("Invalid email or password"), "Expected generic error message to prevent enumeration");
        }
    }

    [Test]
    public async Task WithInactiveUser_ReturnsUnauthorized()
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

        var request = new LoginRequest
        {
            Email = "inactive@example.com",
            Password = "Password123!"
        };

        UserManagerMock
            .Setup(x => x.FindByEmailAsync(request.Email))
            .ReturnsAsync(inactiveUser);

        // Act
        var result = await AuthController.Login(request);

        // Assert
        using (Assert.EnterMultipleScope())
        {
            Assert.That(result, Is.TypeOf<UnauthorizedObjectResult>(), "Expected result to be UnauthorizedObjectResult");
            var unauthorizedResult = result as UnauthorizedObjectResult;
            var response = unauthorizedResult!.Value as LoginResponse;
            Assert.That(response!.Success, Is.False, "Expected success to be false");
            Assert.That(response.Message, Is.EqualTo("Invalid email or password"), "Expected generic error message");
        }

        UserManagerMock.Verify(
            x => x.CheckPasswordAsync(It.IsAny<UserModel>(), It.IsAny<string>()),
            Times.Never,
            "Expected password check to be skipped for inactive user"
        );
    }

    [Test]
    public async Task WithLockedOutUser_ReturnsUnauthorizedWithLockoutMessage()
    {
        // Arrange
        var request = new LoginRequest
        {
            Email = "test@example.com",
            Password = "Password123!"
        };

        UserManagerMock
            .Setup(x => x.FindByEmailAsync(request.Email))
            .ReturnsAsync(_testUser);

        UserManagerMock
            .Setup(x => x.IsLockedOutAsync(_testUser))
            .ReturnsAsync(true);

        // Act
        var result = await AuthController.Login(request);

        // Assert
        using (Assert.EnterMultipleScope())
        {
            Assert.That(result, Is.TypeOf<UnauthorizedObjectResult>(), "Expected result to be UnauthorizedObjectResult");
            var unauthorizedResult = result as UnauthorizedObjectResult;
            var response = unauthorizedResult!.Value as LoginResponse;
            Assert.That(response!.Success, Is.False, "Expected success to be false");
            Assert.That(response.Message, Is.EqualTo("Account is locked. Please try again later."), "Expected lockout message");
        }

        UserManagerMock.Verify(
            x => x.CheckPasswordAsync(It.IsAny<UserModel>(), It.IsAny<string>()),
            Times.Never,
            "Expected password check to be skipped for locked out user"
        );
    }

    [Test]
    public async Task WithIncorrectPassword_ReturnsUnauthorized()
    {
        // Arrange
        var request = new LoginRequest
        {
            Email = "test@example.com",
            Password = "WrongPassword!"
        };

        UserManagerMock
            .Setup(x => x.FindByEmailAsync(request.Email))
            .ReturnsAsync(_testUser);

        UserManagerMock
            .Setup(x => x.IsLockedOutAsync(_testUser))
            .ReturnsAsync(false);

        UserManagerMock
            .Setup(x => x.CheckPasswordAsync(_testUser, request.Password))
            .ReturnsAsync(false);

        // Act
        var result = await AuthController.Login(request);

        // Assert
        using (Assert.EnterMultipleScope())
        {
            Assert.That(result, Is.TypeOf<UnauthorizedObjectResult>(), "Expected result to be UnauthorizedObjectResult");
            var unauthorizedResult = result as UnauthorizedObjectResult;
            var response = unauthorizedResult!.Value as LoginResponse;
            Assert.That(response!.Success, Is.False, "Expected success to be false");
            Assert.That(response.Message, Is.EqualTo("Invalid email or password"), "Expected generic error message");
        }

        RefreshTokenServiceMock.Verify(
            x => x.GenerateRefreshToken(),
            Times.Never,
            "Expected refresh token generation to be skipped for invalid password"
        );
    }

    [Test]
    public async Task WithMissingJwtSecretKey_ReturnsInternalServerError()
    {
        // Arrange
        var request = new LoginRequest
        {
            Email = "test@example.com",
            Password = "Password123!"
        };
        var configValues = new Dictionary<string, string?>
        {
            // Omitting JwtSettings:SecretKey to simulate missing configuration
            { "JwtSettings:Issuer", "TestIssuer" },
            { "JwtSettings:Audience", "TestAudience" },
            { "JwtSettings:AccessTokenExpirationMinutes", "15" },
            { "JwtSettings:RefreshTokenExpirationDays", "7" }
        };

        // For this test, we need to create a new controller instance with the modified configuration
        var configurationWithoutSecret = new ConfigurationBuilder()
            .AddInMemoryCollection(configValues)
            .Build();
        var controllerWithoutSecret = new AuthController(
            UserManagerMock.Object,
            RefreshTokenServiceMock.Object,
            configurationWithoutSecret
        );

        UserManagerMock
            .Setup(x => x.FindByEmailAsync(request.Email))
            .ReturnsAsync(_testUser);

        UserManagerMock
            .Setup(x => x.IsLockedOutAsync(_testUser))
            .ReturnsAsync(false);

        UserManagerMock
            .Setup(x => x.CheckPasswordAsync(_testUser, request.Password))
            .ReturnsAsync(true);

        // Act
        var result = await controllerWithoutSecret.Login(request);

        // Assert
        using (Assert.EnterMultipleScope())
        {
            Assert.That(result, Is.TypeOf<ObjectResult>(), "Expected result to be ObjectResult");
            var objectResult = result as ObjectResult;
            Assert.That(objectResult!.StatusCode, Is.EqualTo(500), "Expected status code 500");
            var response = objectResult.Value as LoginResponse;
            Assert.That(response!.Success, Is.False, "Expected success to be false");
            Assert.That(response.Message, Does.Contain("error occurred"), "Expected error message");
        }
    }

    [Test]
    public async Task WithShortJwtSecretKey_ReturnsInternalServerError()
    {
        // Arrange
        var request = new LoginRequest
        {
            Email = "test@example.com",
            Password = "Password123!"
        };
        var configValues = new Dictionary<string, string?>
        {
            // Secret key is less than 32 bytes (256 bits) required for HS256
            { "JwtSettings:SecretKey", "TooShort" },
            { "JwtSettings:Issuer", "TestIssuer" },
            { "JwtSettings:Audience", "TestAudience" },
            { "JwtSettings:AccessTokenExpirationMinutes", "15" },
            { "JwtSettings:RefreshTokenExpirationDays", "7" }
        };

        var configurationWithShortSecret = new ConfigurationBuilder()
            .AddInMemoryCollection(configValues)
            .Build();
        var controllerWithShortSecret = new AuthController(
            UserManagerMock.Object,
            RefreshTokenServiceMock.Object,
            configurationWithShortSecret
        );

        UserManagerMock
            .Setup(x => x.FindByEmailAsync(request.Email))
            .ReturnsAsync(_testUser);

        UserManagerMock
            .Setup(x => x.IsLockedOutAsync(_testUser))
            .ReturnsAsync(false);

        UserManagerMock
            .Setup(x => x.CheckPasswordAsync(_testUser, request.Password))
            .ReturnsAsync(true);

        // Act
        var result = await controllerWithShortSecret.Login(request);

        // Assert
        using (Assert.EnterMultipleScope())
        {
            Assert.That(result, Is.TypeOf<ObjectResult>(), "Expected result to be ObjectResult");
            var objectResult = result as ObjectResult;
            Assert.That(objectResult!.StatusCode, Is.EqualTo(500), "Expected status code 500");
            var response = objectResult.Value as LoginResponse;
            Assert.That(response!.Success, Is.False, "Expected success to be false");
            Assert.That(response.Message, Does.Contain("error occurred"), "Expected error message");
        }
    }

    [Test]
    public async Task WithValidLogin_SetsCookies()
    {
        // Arrange
        var request = new LoginRequest
        {
            Email = "test@example.com",
            Password = "Password123!"
        };

        UserManagerMock
            .Setup(x => x.FindByEmailAsync(request.Email))
            .ReturnsAsync(_testUser);

        UserManagerMock
            .Setup(x => x.IsLockedOutAsync(_testUser))
            .ReturnsAsync(false);

        UserManagerMock
            .Setup(x => x.CheckPasswordAsync(_testUser, request.Password))
            .ReturnsAsync(true);

        RefreshTokenServiceMock
            .Setup(x => x.GenerateRefreshToken())
            .Returns("mock-refresh-token");

        RefreshTokenServiceMock
            .Setup(x => x.StoreRefreshTokenAsync(It.IsAny<UserModel>(), It.IsAny<string>(), It.IsAny<DateTime>(), It.IsAny<string?>()))
            .Returns(Task.CompletedTask);

        // Act
        var result = await AuthController.Login(request);

        // Assert
        Assert.That(result, Is.TypeOf<OkObjectResult>(), "Expected successful login");

        var cookies = AuthController.HttpContext.Response.Headers.SetCookie.ToString();
        using (Assert.EnterMultipleScope())
        {
            Assert.That(cookies, Does.Contain("accessToken"), "Expected accessToken cookie to be set");
            Assert.That(cookies, Does.Contain("refreshToken"), "Expected refreshToken cookie to be set");
        }
    }

    [Test]
    public async Task WithValidLogin_StoresRefreshTokenWithCorrectExpiration()
    {
        // Arrange
        var request = new LoginRequest
        {
            Email = "test@example.com",
            Password = "Password123!"
        };

        DateTime capturedExpiration = default;

        UserManagerMock
            .Setup(x => x.FindByEmailAsync(request.Email))
            .ReturnsAsync(_testUser);

        UserManagerMock
            .Setup(x => x.IsLockedOutAsync(_testUser))
            .ReturnsAsync(false);

        UserManagerMock
            .Setup(x => x.CheckPasswordAsync(_testUser, request.Password))
            .ReturnsAsync(true);

        RefreshTokenServiceMock
            .Setup(x => x.GenerateRefreshToken())
            .Returns("mock-refresh-token");

        RefreshTokenServiceMock
            .Setup(x => x.StoreRefreshTokenAsync(It.IsAny<UserModel>(), It.IsAny<string>(), It.IsAny<DateTime>(), It.IsAny<string?>()))
            .Callback<UserModel, string, DateTime, string?>((_, _, expiration, _) => capturedExpiration = expiration)
            .Returns(Task.CompletedTask);

        // Act
        await AuthController.Login(request);

        // Assert
        var expectedExpiration = DateTime.UtcNow.AddDays(7);
        Assert.That(capturedExpiration, Is.EqualTo(expectedExpiration).Within(TimeSpan.FromMinutes(1)), "Expected refresh token expiration to be ~7 days from now");
    }

    [Test]
    public async Task WithUnexpectedException_ReturnsInternalServerError()
    {
        // Arrange
        var request = new LoginRequest
        {
            Email = "test@example.com",
            Password = "Password123!"
        };

        UserManagerMock
            .Setup(x => x.FindByEmailAsync(request.Email))
            .ReturnsAsync(_testUser);

        UserManagerMock
            .Setup(x => x.IsLockedOutAsync(_testUser))
            .ReturnsAsync(false);

        UserManagerMock
            .Setup(x => x.CheckPasswordAsync(_testUser, request.Password))
            .ReturnsAsync(true);

        RefreshTokenServiceMock
            .Setup(x => x.GenerateRefreshToken())
            .Returns("mock-refresh-token");

        // Simulate an unexpected exception during token storage
        RefreshTokenServiceMock
            .Setup(x => x.StoreRefreshTokenAsync(It.IsAny<UserModel>(), It.IsAny<string>(), It.IsAny<DateTime>(), It.IsAny<string?>()))
            .ThrowsAsync(new Exception("Database connection failed"));

        // Act
        var result = await AuthController.Login(request);

        // Assert
        using (Assert.EnterMultipleScope())
        {
            Assert.That(result, Is.TypeOf<ObjectResult>(), "Expected result to be ObjectResult");
            var objectResult = result as ObjectResult;
            Assert.That(objectResult!.StatusCode, Is.EqualTo(500), "Expected status code 500");
            var response = objectResult.Value as LoginResponse;
            Assert.That(response!.Success, Is.False, "Expected success to be false");
            Assert.That(response.Message, Does.Contain("error occurred"), "Expected generic error message");
        }
    }
}
