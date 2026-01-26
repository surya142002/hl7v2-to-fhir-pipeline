export type ValidationError = {
    code: string;
    message: string;
    segment?: string;
    field?: string;
  };
  
  export class ValidationException extends Error {
    public readonly errors: ValidationError[];
  
    constructor(errors: ValidationError[]) {
      super(errors.map((e) => `${e.code}: ${e.message}`).join("; "));
      this.errors = errors;
    }
  }
  