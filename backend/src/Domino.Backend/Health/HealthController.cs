using Microsoft.AspNetCore.Mvc;

namespace Domino.Backend.Health;

[ApiController]
[Route("api/[controller]")]
public class HealthController : ControllerBase
{
    [HttpGet]
    public IActionResult GetHealthStatus() => Ok(new HealthResponse("Healthy"));
}