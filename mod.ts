// deno-lint-ignore-file no-explicit-any

export type Result<
  T,
  E extends Error = Error,
> = T | E;

export type CustomError<
  C extends string | number = string | number,
  M extends string = string,
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
): CustomError<C, M> {
  return new Error(message, {
    cause,
  }) as CustomError<C, M>;
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

type Cause<T> = T extends CustomError<any, infer C> ? C : never;
type ExtractCause<T> = T extends { cause: infer C } ? C : never;

export function isErr<
  T extends Result<any>,
  C extends ExtractCause<T> = ExtractCause<T>,
  B extends Cause<T> = Cause<T>,
>(
  value: T,
  cause?: C,
): value is Extract<T, CustomError<any, B>> {
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
