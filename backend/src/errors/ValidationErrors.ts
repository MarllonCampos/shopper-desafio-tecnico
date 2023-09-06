export class ValidationError extends Error {
  data = {};
  status = 0;
  constructor(message: string, data?: any, status?: number) {
    super(message);
    if (data) {
      this.data = data;
    }
    if (status) {
      this.status = status;
    }
  }
}
