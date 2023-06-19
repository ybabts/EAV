import { CaptureErr, Err, IgnoreErr, isErr, Ok } from "./mod.ts";

import { StatusCodes } from "https://deno.land/x/http_status@v1.0.1/mod.ts";

type NotOKStatusCodes = Exclude<keyof typeof StatusCodes, "OK">;

export async function fetchDataFromAPI() {
  const response = await CaptureErr(
    fetch,
    "Fetch Error",
  )("https://api.opendota.com/api/heroes");
  if (isErr(response)) {
    return response;
  }
  if (!response.ok) {
    return new Err<`HTTP_${NotOKStatusCodes}`>(
      `HTTP_${StatusCodes[response.status] as NotOKStatusCodes}`,
      response.statusText +
        ": " +
        (await response.json() as { message: string }).message,
    );
  }
  const json = await CaptureErr(
    response.json.bind(response),
    "JSON Parse Error",
  )() as Err<"JSON Parse Error"> | { [key: string]: any };
  if (isErr(json)) {
    return json;
  }
  return json;
}

const result = await fetchDataFromAPI();
//     ^ = const result: Result<Hero[], Err<Exclude<keyof StatusCodes, "OK">>>
if (isErr(result, "HTTP_FORBIDDEN")) {
  console.error(result);
  //             ^ = const result: Err<Exclude<keyof StatusCodes, "OK">>
}
