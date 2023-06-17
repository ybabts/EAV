// deno-lint-ignore-file no-explicit-any

export type Result<
  T,
  E extends Error | CustomError = CustomError,
> = T | E;

export type CustomError<
  C extends ValidCause = ValidCause,
  M extends string = string,
> = Error & { message: M; cause: C };

// TOOD(ybabts): figure out how to format added messages better
export function addMsg<M extends string, E extends Error>(
  error: E,
  message: M,
) {
  if (error.message.length <= 0) {
    return Object.assign(error, {
      message,
    });
  }
  return Object.assign(error, {
    message: message +
      `\n${error.message.split("\n").map((line) => "  " + line).join("\n")}`,
  });
}

export function Err<C extends ValidCause, M extends string>(
  cause: C,
  message?: M,
): CustomError<C, M> {
  return new Error(message, {
    cause,
  }) as CustomError<C, M>;
}

export function Try<
  T extends (...args: any[]) => any,
  C extends ValidCause = ValidCause,
>(
  func: T,
  cause?: C,
): (...args: Parameters<T>) => ReturnType<T> | CustomError<C> {
  return (...args: Parameters<T>) => {
    try {
      return func(...args);
    } catch (error) {
      error.cause = cause;
      return error;
    }
  };
}

type ExtractCause<T> = T extends { cause: infer C } ? C : never;
type ValidCause = string | number;

export function isErr<
  T extends Result<any>,
  C extends ExtractCause<T> & ValidCause = ExtractCause<T> & ValidCause,
>(
  value: T,
  cause?: C,
): value is Extract<T, CustomError<C, any>> & Extract<T, Error> {
  return value instanceof Error &&
    (cause === undefined || (value as CustomError<C, any>).cause === cause);
}

export function Ok<T>(value: Result<T>): Exclude<T, Error> | null {
  if (value instanceof Error) {
    return null;
  }
  return value as Exclude<T, Error>;
}

export function Unwrap<T>(value: Result<T>): T {
  if (value instanceof Error) {
    throw value;
  }
  return value;
}
