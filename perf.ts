import { CaptureErr, Err, isErr, Result } from "./mod.ts";

let n = 0;

function throwingErrors() {
  const rand = Math.random();
  try {
    if (rand > 0.5) {
      Deno.remove("non-existent-file.txt");
      throw new Error("Random");
    }
    const text = Deno.readTextFileSync("non-existent-file.txt");
    n = Number(text) + 1 + text.length + rand;
    Deno.writeTextFileSync("non-existent-file.txt", String(n));
    return n;
  } catch (e) {
    if (e instanceof Error) {
      Deno.writeTextFileSync("non-existent-file.txt", "0");
    }
    n -= rand;
  }
}

function returningErrors() {
  const rand = Math.random();
  if (rand > 0.5) {
    Deno.remove("non-existent-file.txt");
    return new Err("Random");
  }
  const text = CaptureErr(Deno.readTextFileSync)("non-existent-file.txt");
  if (isErr(text)) {
    Deno.writeTextFileSync("non-existent-file.txt", "0");
    n -= rand;
    return;
  }
  n = Number(text) + 1 + text.length + rand;
  Deno.writeTextFileSync("non-existent-file.txt", String(n));
  return n;
}

function throwingErrorsRecursive(): number {
  const rand = Math.random();
  if (rand > 0.66) {
    throw new Error("Random");
  } else if (rand < 0.33) {
    return throwingErrorsRecursive();
  }
  return rand;
}

function returningErrorsRecursive(): Result<number, Err<"Random">> {
  const rand = Math.random();
  if (rand > 0.66) {
    return new Err("Random");
  } else if (rand < 0.33) {
    return returningErrorsRecursive();
  }
  return rand;
}

Deno.bench({
  name: "Throwing Errors",
  group: "with file operations",
  fn() {
    try {
      const result = throwingErrors();
      if (result === undefined) return;
      result / 5;
      return;
    } catch (_error) {
      // handle error
      return;
    }
  },
});

Deno.bench({
  name: "Returning Errors",
  group: "with file operations",
  fn() {
    const result = returningErrors();
    if (isErr(result)) {
      // handle error
      return;
    }
    if (result === undefined) return;
    result / 5;
    return;
  },
});

Deno.bench({
  name: "Throwing Errors Recursive",
  group: "with a large stack trace",
  fn() {
    try {
      throwingErrorsRecursive();
    } catch (_e) {
      // handle error
    }
  },
});

Deno.bench({
  name: "Returning Errors Recursive",
  group: "with a large stack trace",
  fn() {
    const result = returningErrorsRecursive();
    if (isErr(result)) {
      // handle error
      return;
    }
  },
});
