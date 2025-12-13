using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;

namespace Domino.Backend.Application.Users;

[ApiController]
[Route("api/[controller]")]
public class AuthController : ControllerBase
{
    private readonly UserManager<UserModel> _userManager;

    public AuthController(UserManager<UserModel> userManager)
    {
        _userManager = userManager;
    }

    [HttpPost("register")]
    public async Task<IActionResult> Register([FromBody] RegisterRequest request)
    {
        if (!ModelState.IsValid)
        {
            var errors = ModelState.Values
                .SelectMany(v => v.Errors)
                .Select(e => e.ErrorMessage)
                .ToList();

            return BadRequest(new RegisterResponse
            {
                Success = false,
                Message = "Validation failed",
                Errors = errors
            });
        }

        var user = new UserModel
        {
            UserName = request.Email,
            Email = request.Email,
            FirstName = request.FirstName,
            LastName = request.LastName,
            Birthday = request.Birthday,
            IsActive = true
        };

        var result = await _userManager.CreateAsync(user, request.Password);

        if (!result.Succeeded)
        {
            var errors = result.Errors.Select(e => e.Description).ToList();
            return BadRequest(new RegisterResponse
            {
                Success = false,
                Message = "Registration failed",
                Errors = errors
            });
        }

        return Ok(new RegisterResponse
        {
            Success = true,
            Message = "User registered successfully"
        });
    }
}

