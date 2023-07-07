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
  R extends any,
>(
  value: Result<R>,
): R | null {
  if (isErr(value)) {
    return null;
  }
  return value;
}

type InnerType<T> = T extends Promise<infer U> ? U : never;

export function CaptureErr<
  F extends (...args: any[]) => any,
  N extends string,
  R extends ReturnType<F>,
>(
  name: N,
  fn: F,
  message?: string,
): R extends Promise<any> ? Promise<InnerType<R> | Err<N>> : R | Err<N> {
  try {
    const result = fn();
    if (result instanceof Promise) {
      return result.catch((e: Error) => {
        e.cause = new Err(name ?? e.name, message ?? e.message);
        return Promise.resolve(e as Err<N>);
      }) as any;
      //     ^ BEGONE TYPE ERRORS!
      // TODO(ybabts) figure out how to get this conditional type to work
    }
    return result;
  } catch (error) {
    error.cause = new Err(name ?? error.name, message ?? error.message);
    return error;
  }
}

export function UnwrapErr<T>(result: Result<T>): T {
  if (result instanceof Error) {
    throw result;
  }
  return result;
}
