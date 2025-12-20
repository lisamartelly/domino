using Domino.Backend.Application.Users;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Moq;

namespace Domino.Backend.Tests.UsersTests.AuthControllerTests;

public class RegisterTests : AuthControllerTestsBase
{
    [Test]
    public async Task WithValidRequest_ReturnsOkWithSuccessResponse()
    {
        // Arrange
        var request = new RegisterRequest
        {
            Email = "test@example.com",
            Password = "Password123!",
            FirstName = "John",
            LastName = "Doe",
            Birthday = new DateOnly(1990, 1, 1)
        };

        UserManagerMock
            .Setup(x => x.CreateAsync(It.IsAny<UserModel>(), It.IsAny<string>()))
            .ReturnsAsync(IdentityResult.Success);

        // Act
        var result = await AuthController.Register(request);

        // Assert
        using (Assert.EnterMultipleScope())
        {
            Assert.That(result, Is.TypeOf<OkObjectResult>(), "Expected result to be OkObjectResult");
            var okResult = result as OkObjectResult;
            Assert.That(okResult!.Value, Is.Not.Null, "Expected value to not be null");
            var response = okResult.Value as RegisterResponse;
            Assert.That(response!.Success, Is.True, "Expected success to be true");
            Assert.That(response.Message, Is.EqualTo("User registered successfully"), "Expected success message");
        }

        UserManagerMock.Verify(
            x => x.CreateAsync(
                It.Is<UserModel>(u =>
                    u.Email == request.Email &&
                    u.UserName == request.Email &&
                    u.FirstName == request.FirstName &&
                    u.LastName == request.LastName &&
                    u.Birthday == request.Birthday &&
                    u.IsActive == true
                ),
                request.Password
            ),
            Times.Once,
            "Expected CreateAsync to be called once with correct user data"
        );
    }

    [Test]
    public async Task WithInvalidModelState_ReturnsBadRequest()
    {
        // Arrange
        var request = new RegisterRequest
        {
            Email = "invalid-email",
            Password = "123",
            FirstName = "",
            LastName = "",
            Birthday = new DateOnly(1990, 1, 1)
        };

        AuthController.ModelState.AddModelError("Email", "The Email field is not a valid e-mail address.");
        AuthController.ModelState.AddModelError("Password", "The Password field must be at least 6 characters.");

        // Act
        var result = await AuthController.Register(request);

        // Assert
        using (Assert.EnterMultipleScope())
        {
            Assert.That(result, Is.TypeOf<BadRequestObjectResult>(), "Expected result to be BadRequestObjectResult");
            var badRequestResult = result as BadRequestObjectResult;
            Assert.That(badRequestResult!.Value, Is.Not.Null, "Expected value to not be null");
            var response = badRequestResult.Value as RegisterResponse;
            Assert.That(response!.Success, Is.False, "Expected success to be false");
            Assert.That(response.Message, Is.EqualTo("Validation failed"), "Expected validation failed message");
            Assert.That(response.Errors, Is.Not.Empty, "Expected errors to not be empty");
        }

        UserManagerMock.Verify(
            x => x.CreateAsync(It.IsAny<UserModel>(), It.IsAny<string>()),
            Times.Never,
            "Expected CreateAsync to not be called when model is invalid"
        );
    }

    [Test]
    public async Task WhenUserCreationFails_ReturnsBadRequestWithErrors()
    {
        // Arrange
        var request = new RegisterRequest
        {
            Email = "test@example.com",
            Password = "Password123!",
            FirstName = "John",
            LastName = "Doe",
            Birthday = new DateOnly(1990, 1, 1)
        };

        var identityErrors = new[]
        {
            new IdentityError { Code = "DuplicateEmail", Description = "Email already exists" }
        };

        UserManagerMock
            .Setup(x => x.CreateAsync(It.IsAny<UserModel>(), It.IsAny<string>()))
            .ReturnsAsync(IdentityResult.Failed(identityErrors));

        // Act
        var result = await AuthController.Register(request);

        // Assert
        using (Assert.EnterMultipleScope())
        {
            Assert.That(result, Is.TypeOf<BadRequestObjectResult>(), "Expected result to be BadRequestObjectResult");
            var badRequestResult = result as BadRequestObjectResult;
            Assert.That(badRequestResult!.Value, Is.Not.Null, "Expected value to not be null");
            var response = badRequestResult.Value as RegisterResponse;
            Assert.That(response!.Success, Is.False, "Expected success to be false");
            Assert.That(response.Message, Is.EqualTo("Registration failed"), "Expected registration failed message");
            Assert.That(response.Errors, Is.Not.Empty, "Expected errors to not be empty");
            Assert.That(response.Errors, Contains.Item("Email already exists"), "Expected error message to be included");
        }
    }

    [Test]
    public async Task Register_CreatesUserWithCorrectProperties()
    {
        // Arrange
        var request = new RegisterRequest
        {
            Email = "jane@example.com",
            Password = "SecurePass456!",
            FirstName = "Jane",
            LastName = "Smith",
            Birthday = new DateOnly(1985, 5, 15)
        };

        UserModel? createdUser = null;
        UserManagerMock
            .Setup(x => x.CreateAsync(It.IsAny<UserModel>(), It.IsAny<string>()))
            .Callback<UserModel, string>((user, password) => createdUser = user)
            .ReturnsAsync(IdentityResult.Success);

        // Act
        await AuthController.Register(request);

        // Assert
        using (Assert.EnterMultipleScope())
        {
            Assert.That(createdUser, Is.Not.Null, "Expected user to be created");
            Assert.That(createdUser!.Email, Is.EqualTo(request.Email), "Expected email to match");
            Assert.That(createdUser.UserName, Is.EqualTo(request.Email), "Expected username to match email");
            Assert.That(createdUser.FirstName, Is.EqualTo(request.FirstName), "Expected first name to match");
            Assert.That(createdUser.LastName, Is.EqualTo(request.LastName), "Expected last name to match");
            Assert.That(createdUser.Birthday, Is.EqualTo(request.Birthday), "Expected birthday to match");
            Assert.That(createdUser.IsActive, Is.True, "Expected IsActive to be true");
        }
    }
}
