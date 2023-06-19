# Table of Contents

- [Introduction](#introduction)
  - [The Problem with Traditional Error Handling](#the-problem-with-traditional-error-handling)
  - [The Errors as Values Approach](#the-errors-as-values-approach)
  - [Why you should adope the Errors as Values Paradigm](#why-should-i-adopt-this-paradigm)
- [Limitations of Linters and Static Analysis Tools](#limitations-of-linters-and-static-analysis-tools)
- [V8 JIT Performance with Errors as Values](#v8-and-jit-compiler-performance)
- [Leveraging Typescript's Type System](#leveraging-typescripts-type-system-with-errors-as-values)
- [Practical Examples](#practical-examples)
  - [Reading a Configuration File](#example-1-reading-a-configuration-file)
- [Importing Errors as Values into your project](#importing-eav-into-your-project)

# Introduction

Errors as values is an innovative approach to error handling in Typescript that
treats errors not as exceptional circumstances but natural outcomes of
operations. This approach moves away from the traditional try/catch model,
promoting clarity, control, and explicitness in the error handling process.

<a id="the-problem-with-traditional-error-handling" ></a> Traditional error
handling relies on try/catch blocks where the errors are "thrown" and later
"caught" in a completely different context. This model views errors as
interruptions to the normal flow of a program, which often results in scattered
and convoluted error handling code. In addition, the try/catch model makes it
easy for developers to ignore or miss errors, leading to unexpected runtime
issues and potentially system failures.

<a id="the-errors-as-values-approach" ></a>Errors as values encourages
developers to handle errors right where they occur. By treating errors as
returnable values from functions, we can deal with them at the same level as the
rest of our application logic. The errors as values approach acknowledges that
errors are just another type of result that a function can produce. This
approach leads to more explicit, readable, and maintainable code.

# Why should I adopt this paradigm?

Adopting the errors as values approach inherently leads to a more proactive
error handling mechanism. The consumer of a function written using errors as
values is always presented with the reality that the function could potentially
return an error. This very nature of errors as values encourages, or rather
necessitates, that the error be handled immediately at the point of function
invocation. The possibility of an error being returned cannot be ignored or
deferred; it must be addressed immediately at the point of function invocation.
This way, error handling becomes an integral part of the normal control flow of
the application. The real advantage of this is two fold: firstly it leads to
more robust code as it reduces the likelihood of unhandled errors causing
unexpected behavior or crashes. Secondly, it fosters a coding discipline where
programmers are habitually conscious and cautious about potential failures and
are more dilligent in managing them, leading to higher code quality overall.

# Limitations of Linters and Static Analysis Tools

The dynamism and flexibility of JavaScript is a double-edged sword. While it
empowers developers to write expressive and flexible code, it often makes static
analysis of the code a challenge. This is particularly true when it comes to
predicting where a program might throw an error. Current IDEs and linters can
only do so much to warn about potential exceptions due to JavaScript's dynamic
nature. However, the Errors as Values approach provides a means to mitigate this
issue. With Errors as Values, error possibilities are transformed into explicit
return values which are part of the function's signature. This explicitness
makes it far easier to track where errors could be thrown and how they should be
handled. Errors become first-class citizens that can be reasoned about and
manipulated just like any other value. As a result, developers gain more control
over the error management in their programs, leading to more predictable and
robust code.

# V8 and JIT compiler Performance

The V8 engine, which powers JavaScript execution in Google Chrome and other
modern browsers, uses a Just-In-Time (JIT) compiler to optimize code execution.
The JIT compiler makes assumptions about your code to perform these
optimizations. However, certain code patterns can cause the JIT compiler to
"bailout" and deoptimize the code, leading to slower execution.

One such pattern is the extensive use of try/catch blocks. When a try/catch
block is encountered, the V8 engine has to be prepared for an exception at any
time, which can prevent certain optimizations. This is because the engine must
preserve the execution context until the end of the catch block, which can be
resource-intensive for large blocks of code.

This is where the Errors as Values (EAV) paradigm shines. By treating errors as
regular return values, EAV encourages the use of smaller, more contained
try/catch blocks. Instead of wrapping large chunks of code in a try/catch block,
EAV typically uses these blocks around individual function calls that might
throw an error. This results in smaller execution contexts that need to be
preserved, which can allow the V8 engine to optimize more effectively.

In addition, by handling errors as regular values, EAV can make your code more
predictable. This predictability can further improve the ability of the V8
engine to make assumptions about your code and apply optimizations.

It's important to note that while EAV can potentially lead to better
performance, the actual impact will depend on various factors, including the
specific nature of your code and the JavaScript engine's implementation details.
Therefore, always consider using performance profiling tools to understand the
impact of different coding paradigms on your application's performance.

# Leveraging Typescript's Type System with Errors as Values

One of the key strengths of the Errors as Values (EAV) paradigm is how it
leverages TypeScript's powerful type system. TypeScript's static types provide a
way to describe the shape and behavior of objects within your code, which can be
incredibly useful when dealing with errors.

## Union Types

In the EAV paradigm, a function might return a result that could be an `Error`.
To represent this, `Union` types are used extensively to make it explicit that
the result of a function could be an `Error`, and what kind of `Error`s they
could be.

For example, consider a function readConfig that reads and parses a
configuration file. This function could potentially encounter two types of
errors: a read error if the file can't be read, and a parse error if the file's
content can't be parsed. Therefore, the function's return type is a union of the
configuration object type, `Err<"ReadError">`, and `Err<"ParseError">`.

This explicit typing provides a clear understanding of all possible outcomes of
the function. It also allows TypeScript's type checking to ensure that all
potential errors are handled.

## Type Guards and Error Checking

The `isErr` function is a type guard that checks if a value is an instance of
`Error`. If an optional name parameter is provided, it also checks if the
error's name matches the provided name. This allows us to narrow down the type
from a union of `T | Error` to just `T` or `Error`, enabling more precise error
handling.

For instance, after calling `readConfig`, we can use `isErr` to check if the
result is a read error or a parse error, and handle each case appropriately. If
the result isn't an error, TypeScript knows that it must be the configuration
object, and can treat it as such.

## Avoiding the any Type

It's important to note that the `any` type in TypeScript can override all other
types and cause the type checking portion of EAV to fail. For example
`JSON.parse` returns an `any` type, which could potentially lead to runtime and
type checking problems. Therefore, it's generally recommended to avoid the `any`
type when using TypeScript.

# Practical Examples

In this section, we will walk through several practical examples that
demonstrate the application of the Errors as Values (EAV) approach. These
examples will help you understand how to handle and propagate errors, and how to
use helper functions in real-world scenarios.

## Example 1: Reading a Configuration File

Our first example involves reading a configuration file, a common operation that
can encounter various errors. We'll show how EAV can handle potential issues
such as the file not existing, lacking proper permissions, or containing
improperly formatted content.

We'll start by defining a function that reads the file and parses its content.
With EAV, we handle errors where they occur, so if an error arises during the
reading or parsing process, it will be immediately caught and returned as a
value. This allows the calling function to handle the error in the same context
as the successful outcome.

```ts
function readConfig(filePath: string) {
  const text = CaptureErr(Deno.readTextFileSync, "ReadError")(filePath);
  if (isErr(text)) return text; // <-- Err<"ReadError">
  const json = CaptureErr(JSON.parse, "ParseError")(text);
  if (isErr(json)) return json as Err<"ParseError">;
  return json as { port: number; host: string };
}

const config = readConfig("./config.json");
//      ^ const config: { port: number; host: string } | Err<"ReadError"> | Err<"ParseError">
```

You can see here from the example code provided, the type information displays a
`Union` type of all the potential outcomes of this function. It can either
return the configuration object, a read error, or a parse error. The name of
these errors allow you to see what errors could happen in the function return.
You can also check for specific errors and narrow the type like this next code
snippet.

```ts
const config = readConfig("./config.json");
//      ^ const config: { port: number; host: string } | Err<"ReadError"> | Err<"ParseError">
if (isErr(config, "ReadError")) {
  console.error("Could not read config file", config.message);
}
if (isErr(config, "ParseError")) {
  console.error("Could not parse config file", config.message);
}
console.log(config);
// ^ const config: { port: number; host: string }
```

## Example 2: Fetching User Data

In the second example, we'll demonstrate how EAV can provide greater control
over the system's flow when fetching user data. We'll define a function that
attempts to retrieve user data from three different sources: a cache, a primary
database, and a backup database.

```ts
type UserData = {
  id: number;
  name: string;
  email: string;
};

const cache = new Map<string, UserData>();

function getFromCache(key: string) {
  if (cache.has(key)) return cache.get(key);
  return new Err("CacheMiss");
}

async function fetchFromPrimaryDatabase(key: string) {
  const res = await CaptureErr(fetch, "FetchError")(
    `https://localhost:8123/${key}`,
  );
  if (isErr(res)) return res;
  const json = await CaptureErr(res.json.bind(res), "JSONParseError")();
  if (isErr(json)) return json as Err<"JSONParseError">;
  return json as UserData;
}

async function fetchFromBackupDatabase(key: string) {
  const res = await CaptureErr(fetch, "FetchError")(
    `https://localhost:8123/${key}`,
  );
  if (isErr(res)) return res;
  const json = await CaptureErr(res.json.bind(res), "JSONParseError")();
  if (isErr(json)) return json as Err<"JSONParseError">;
  return json as UserData;
}

async function fetchUser(key: string) {
  return Ok(getFromCache(key)) ??
    await fetchFromPrimaryDatabase(key) ??
    await fetchFromBackupDatabase(key);
}
```

With EAV, if an error occurs at any point, it will be immediately caught and
handled. This allows us to implement a fallback mechanism: if retrieving data
from the cache fails, we try the primary database, and if that also fails, we
try the backup database. If all attempts fail, we return an error indicating
that all methods have failed. Each failure is accompanied by a specific error
message, providing insights into why each method failed.

## Example 3: Handling API Responses

Our final example involves handling responses from an API. APIs often return
errors as part of the response, and EAV provides a straightforward way to handle
these errors.

```ts
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
```

We'll define a function that makes an API request and processes the response. If
the API returns an error, our function will catch it and return it as a value.
This allows the calling function to handle the error in the same context as the
successful outcome, leading to cleaner and more predictable code.

```ts
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
```

Remember, these examples are just a starting point. As you become more familiar
with EAV, you'll find that its principles can be applied in many different
situations, helping you write more reliable and maintainable code.

# Importing

To use the Errors as Values (EAV) library in your project, import the necessary
functions or classes using ES6 imports. Here's an example:

```ts
import { isErr, Err, ... } from "https://deno.land/x/eav@0.1.0/mod.ts";
```

Remember to specify the version number (`0.1.0` in this example) to ensure
you're using a stable, known version of the library.
