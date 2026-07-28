export class FlowError extends Error {
  constructor(
    public code:       string,
    message:           string,
    public statusCode: number = 400,
    public meta?:      Record<string, unknown>
  ) {
    super(message);
    this.name = "FlowError";
    Object.setPrototypeOf(this, FlowError.prototype);
  }
}
