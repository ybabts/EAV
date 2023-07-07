// deno-lint-ignore-file no-explicit-any

/**
 * A custom class that extends Error that allows for namable Errors inside
 * the type system.
 *
 * ```
 * const myError = new Err("MyError");
 * // myError: Err<"MyError">
 * ```
 */
export class Err<N extends string = "Error"> extends Error {
  name!: N;
  cause?: Err;
  constructor(name?: N, message?: string, cause?: Error) {
    super(message, {
      cause,
    });
    if (name) {
      this.name = name;
    }
  }
}

/**
 * A union type between a return type `T` and an Error type `E`.
 */
export type Result<T, E extends Error | Err = Err<string>> = T | E;

type ExtractName<T> = T extends { name: infer N } ? N : never;

/**
 * Returns whether a `Result` is an instance of an Error. If a `name` is provided,
 * checks if the Error's name or it's causes contain an Error with that name.
 *
 * ```
 * const result = await CaptureErr("Fetch Error", async (): MyStruct => {
 *  const res = await fetch(url);
 *  return await res.json();
 * });
 * if(isErr(result, "Fetch Error")) {
 *  // result: Err<"Fetch Error">
 * } else {
 *  // result: MyStruct
 * }
 * ```
 */
export function isErr<R extends Result<any>, N extends ExtractName<R> & string>(
  result: R,
  name?: N,
): result is Extract<R, Err<N>> & Extract<R, Error> {
  if (!(result instanceof Error)) return false;
  if (name === undefined) return true;
  if (result.name === name) return true;
  if (result.cause instanceof Error) {
    return isErr(result.cause, name);
  }
  return false;
}

/**
 * Returns the result if it's not an Error, otherwise returns `null`.
 *
 * The primary use of this function is with the nullish coalescence operator
 * `??` in providing a value if the result ended up being an Error.
 *
 * ```
 * function parseJSON(input: string) {
 *  const json = CaptureErr("JSON Parse Error",
 *    () => JSON.parse(input)
 *  )
 *  return Ok(json) ?? {}
 * }
 * ```
 */
export function Ok<
  R extends any,
>(
  result: Result<R>,
): R | null {
  if (isErr(result)) {
    return null;
  }
  return result;
}

type InnerType<T> = T extends Promise<infer U> ? U : never;

/**
 * Captures an Error in the given `callback` function and returns it as a
 * `Result` with the specified Error `name`.
 *
 * ```
 * // result: MyStruct | Err<"Fetch Error">
 * const result = await CaptureErr("Fetch Error", async (): MyStruct => {
 *  const res = await fetch(url);
 *  return await res.json();
 * });
 * ```
 */
export function CaptureErr<
  F extends (...args: any[]) => any,
  N extends string,
  R extends ReturnType<F>,
>(
  name: N,
  callback: F,
  message?: string,
): R extends Promise<any> ? Promise<InnerType<R> | Err<N>> : R | Err<N> {
  try {
    const result = callback();
    if (result instanceof Promise) {
      return result.catch((capturedError: Error) => {
        capturedError.cause = new Err(
          name ?? capturedError.name,
          message ?? capturedError.message,
        );
        return Promise.resolve(capturedError as Err<N>);
      }) as any;
      //     ^ BEGONE TYPE ERRORS!
      // TODO(ybabts) figure out how to get this conditional type to work
    }
    return result;
  } catch (capturedError) {
    capturedError.cause = new Err(
      name,
      message,
    );
    return capturedError;
  }
}

/**
 * Unwraps a `Result`, throwing the Error if one exists.
 *
 * This should only be used
 * when the given Error cannot be resolved gracefully or you are completely
 * sure the `Result` will not produce an Error.
 * ```
 * const result = await CaptureErr("Fetch Error", async (): MyStruct => {
 *  const res = await fetch(url);
 *  return await res.json();
 * });
 * // ^ result: MyStruct | Err<"Fetch Error"
 * const json = UnwrapErr(result);
 * // ^ json: MyStruct
 * ```
 */
export function UnwrapErr<T>(result: Result<T>): T {
  if (result instanceof Error) {
    throw result;
  }
  return result;
}
