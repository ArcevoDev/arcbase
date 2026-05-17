export class ApiError extends Error {
  public statusCode: number;

  constructor(message: string, statusCode: number) {
    super(message);
    this.statusCode = statusCode;
    Object.setPrototypeOf(this, ApiError.prototype);
  }

  static badRequest(msg: string) {
    return new ApiError(msg, 400);
  }
  static unauthorized(msg: string = "Invalid credentials") {
    return new ApiError(msg, 401);
  }
  static forbidden(msg: string = "Access denied") {
    return new ApiError(msg, 403);
  }
  static notFound(msg: string) {
    return new ApiError(msg, 404);
  }
  static internal(msg: string = "Internal server error") {
    return new ApiError(msg, 500);
  }
}
