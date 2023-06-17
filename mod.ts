// deno-lint-ignore-file no-explicit-any

export type Result<
  T,
  E extends Error = Error,
> = T | E;

export type CustomError<
  M extends string,
  C extends string | number,
> = Error & { message: M; cause: C };

export function addMsg<M extends string, E extends Error>(
  error: E,
  message: M,
) {
  return Object.assign(error, {
    message: message +
      `\n${error.message.split("\n").map((line) => "  " + line).join("\n")}`,
  });
}

export function Err<C extends string | number, M extends string>(
  cause: C,
  message?: M,
): CustomError<M, C> {
  return new Error(message, {
    cause,
  }) as CustomError<M, C>;
}

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

type ExtractCauseType<T> = T extends { cause: infer C } ? C : never;

export function isErr<
  T extends Error | any,
  C extends Exclude<T, any>,
>(
  value: T,
  cause?: ExtractCauseType<T>,
): value is C {
  return value instanceof Error &&
    (cause === undefined || value.cause === cause);
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
