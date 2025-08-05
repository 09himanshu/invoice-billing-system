export class CustomError extends Error {
  constructor(
    public status: boolean,
    public statusCode: number,
    public message: string,
    public isOperational = true
  ) {
    super(message);
    Object.setPrototypeOf(this, CustomError.prototype);
  }
}


export class BadRequest extends CustomError {
  constructor(message: string,) {
    super(false, 400,message);
  }
}

export class Unauthorize extends CustomError {
  constructor(message: string,) {
    super(false, 401,message);
  }
}

export class ForBidden extends CustomError {
  constructor(message: string,) {
    super(false, 403,message);
  }
}

export class NotFound extends CustomError {
  constructor(message: string,) {
    super(false, 404,message);
  }
}

export class InternalServer extends CustomError {
  constructor(message: string,) {
    super(false, 500,message);
  }
}