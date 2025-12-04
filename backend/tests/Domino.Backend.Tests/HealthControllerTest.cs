using Domino.Backend.Health;
using Microsoft.AspNetCore.Mvc;

namespace Domino.Backend.Tests;

[TestFixture]
public class HealthControllerTest
{
    [Test]
    public void GetHealthStatus_ReturnsHealthyStatus()
    {
        // Arrange
        HealthController controller = new();

        // Act
        var result = controller.GetHealthStatus();

        // Assert
        using (Assert.EnterMultipleScope())
        {
            Assert.That(result, Is.TypeOf<OkObjectResult>(), "Expected result to be of type OkObjectResult");
            var okResult = result as OkObjectResult;
            Assert.That(okResult!.Value, Is.Not.Null, "Expected OkObjectResult value to be not null");
            var value = okResult.Value as HealthResponse;
            Assert.That(value!.Status, Is.EqualTo("Healthy"), "Expected status to be 'Healthy'");
        }
    }   
}