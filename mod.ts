// deno-lint-ignore-file no-explicit-any

export class Err<N extends string = "Error"> extends Error {
  name!: N;
  constructor(name?: N, message?: string) {
    super(message);
    if (name) {
      this.name = name;
    }
  }
}

export type Result<T, E extends Error | Err = Err> = T | E;

export type ExtractName<T> = T extends { name: infer N } ? N : never;

export function isErr<R extends Result<any>, N extends ExtractName<R> & string>(
  value: R,
  name?: N,
): value is Extract<R, Err<N>> & Extract<R, Error> {
  return value instanceof Error && (name === undefined || value.name === name);
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
  fn: T,
  name?: N,
  message?: string,
): (...args: Parameters<T>) => ReturnType<T> | Err<N> {
  return function CaptureErr(...args: Parameters<T>) {
    try {
      const result = fn(...args);
      if (result instanceof Promise) {
        return result.catch((e: Error) => {
          e.cause = new Err(name ?? e.name, message ?? e.message);
          return Promise.resolve(e);
        });
      }
      return result;
    } catch (error) {
      error.cause = new Err(name ?? error.name, message ?? error.message);
      return error;
    }
  };
}

export function IgnoreErr<T>(value: Result<T>): T {
  if (value instanceof Error) {
    throw value;
  }
  return value;
}
