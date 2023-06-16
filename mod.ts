export type Result<
  T,
  E extends Error = Error,
> = T | E;

export type CustomError<M extends string> = Error & { message: M };

export function addMsg<M extends string, E extends Error>(
  error: E,
  message: M,
): CustomError<`${M}\n${string}`> {
  return Object.assign(error, {
    message: message +
      `\n${error.message.split("\n").map((line) => "  " + line).join("\n")}`,
  }) as CustomError<`${M}\n${string}`>;
}

export function Err<M extends string>(message: M): CustomError<M> {
  return new Error(message) as CustomError<M>;
}

// deno-lint-ignore no-explicit-any
export function Try<T extends (...args: any[]) => any>(
  func: T,
): (...args: Parameters<T>) => ReturnType<T> | Error {
  return (...args: Parameters<T>) => {
    try {
      return func(...args);
    } catch (error) {
      return error;
    }
  };
}

// deno-lint-ignore no-explicit-any
export function isErr<T extends Error>(value: Result<any>): value is T {
  return value instanceof Error;
}

export function Ok<T>(value: Result<T>): T | null {
  if (value instanceof Error) {
    return null;
  }
  return value;
}

export function Unwrap<T>(value: Result<T>): T {
  if (value instanceof Error) {
    throw value;
  }
  return value;
}
