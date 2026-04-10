namespace Domino.Backend.Utilities;

public enum ServiceErrorKind
{
    NotFound,
    Validation
}

public record ServiceError(ServiceErrorKind Kind, string Message);

public static class ServiceResult
{
    public static ServiceResult<T> Success<T>(T value) => new(value);
    public static ServiceResult<T> NotFound<T>(string message) => new(new ServiceError(ServiceErrorKind.NotFound, message));
    public static ServiceResult<T> Invalid<T>(string message) => new(new ServiceError(ServiceErrorKind.Validation, message));
}

public sealed class ServiceResult<T>
{
    public T? Value { get; }
    public ServiceError? Error { get; }
    public bool IsSuccess => Error is null;

    internal ServiceResult(T value) => Value = value;
    internal ServiceResult(ServiceError error) => Error = error;
}
