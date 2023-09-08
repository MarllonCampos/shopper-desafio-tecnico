export class ValidationError extends Error {
  data = {};
  status = 400;
  constructor(message: string, data?: any) {
    super(message);
    if (data) {
      this.data = data;
    }
  }
}
