export class ApiError extends Error {
  public statusCode: number;
  public code:       string;

  constructor(message: string, statusCode: number, code?: string) {
    super(message);
    this.statusCode = statusCode;
    this.code       = code ?? `HTTP_${statusCode}`;
    this.name       = "ApiError";
    Object.setPrototypeOf(this, ApiError.prototype);
  }

  static badRequest(msg: string)              { return new ApiError(msg, 400, "BAD_REQUEST"); }
  static unauthorized(msg = "Unauthorized")   { return new ApiError(msg, 401, "UNAUTHORIZED"); }
  static forbidden(msg = "Forbidden")         { return new ApiError(msg, 403, "FORBIDDEN"); }
  static notFound(msg: string)                { return new ApiError(msg, 404, "NOT_FOUND"); }
  static conflict(msg: string)                { return new ApiError(msg, 409, "CONFLICT"); }
  static unprocessable(msg: string)           { return new ApiError(msg, 422, "UNPROCESSABLE"); }
  static internal(msg = "Internal error")     { return new ApiError(msg, 500, "INTERNAL_SERVER_ERROR"); }
}
