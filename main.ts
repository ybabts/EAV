import { CaptureErr, isErr } from "./mod.ts";

const result = CaptureErr(
  "Fetch Error",
  async () => await fetch("https://www.google.com"),
);

const str = CaptureErr(
  "Fetch Error",
  () => "https://www.google.com",
);

if (isErr(str, EvalError)) {
  str;
}
