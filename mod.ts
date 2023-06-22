// deno-lint-ignore-file no-explicit-any

export class Err<N extends string = "Error"> extends Error {
  name!: N;
  cause?: Err;
  constructor(name?: N, message?: string) {
    super(message);
    if (name) {
      this.name = name;
    }
  }
}

export type Result<T, E extends Error | Err = Err<string>> = T | E;

export type ExtractName<T> = T extends { name: infer N } ? N : never;

export function isErr<R extends Result<any>, N extends ExtractName<R> & string>(
  value: R,
  name?: N,
): value is Extract<R, Err<N>> & Extract<R, Error> {
  if (!(value instanceof Error)) return false;
  if (name === undefined) return true;
  if (value.name === name) return true;
  if (value.cause instanceof Error) {
    return isErr(value.cause, name);
  }
  return false;
}

export function Ok<
  R extends Result<any>,
>(
  value: R,
): R | null {
  if (isErr(value)) {
    return null;
  }
  return value;
}

export function CaptureErr<
  T extends (...args: any[]) => any,
  N extends string,
>(
  name: N,
  fn: T,
  message?: string,
): ReturnType<T> | Err<N> {
  try {
    const result = fn();
    if (result instanceof Promise) {
      return result.catch((e: Error) => {
        e.cause = new Err(name ?? e.name, message ?? e.message);
        return Promise.resolve(e);
      }) as ReturnType<T> | Err<N>;
    }
    return result;
  } catch (error) {
    error.cause = new Err(name ?? error.name, message ?? error.message);
    return error;
  }
}

export function IgnoreErr<T>(value: Result<T>): T {
  if (value instanceof Error) {
    throw value;
  }
  return value;
}
