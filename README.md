# Errors as Values - A Paradigm Shift in Error Handling

Errors as values is an innovative approach to error handling in Typescript that
treats errors not as exceptional circumstances but natural outcomes of
operations. This approach moves away from the traditional try/catch model,
promoting clarity, control, and explicitness in the error handling process.

Traditional error handling relies on try/catch blocks where the errors are
"thrown" and later "caught" in a completely different context. This model views
errors as interruptions to the normal flow of a program, which often results in
scattered and convoluted error handling code. In addition, the try/catch model
makes it easy for developers to ignore or miss errors, leading to unexpected
runtime issues and potentially system failures.

Errors as values encourages developers to handle errors right where they occur.
By treating errors as returnable values from functions, we can deal with them at
the same level as the rest of our application logic. The errors as values
approach acknowledges that errors are just another type of result that a
function can produce. This approach leads to more explicit, readable, and
maintainable code.

## Why should we adopt this paradigm?

Adopting the errors as values approach inherently leads to a more proactive
error handling mechanism. The consumer of a function written using errors as
values is always presented with the reality that the function could potentially
return an error. This very nature of errors as values encourages, or rather
necessitates, that the error be handled immediately at the point of function
invocation. The possibility of an error being returned cannot be ignored or
deferred; it must be addressed immediately at the point of function invocation.
This way, error handling becomes an integral part of the normal control
flow of the application. The real advantage of this is two fold: firstly it
leads to more robust code as it reduces the likelihood of unhandled errors
causing unexpected behavior or crashes. Secondly, it fosters a coding discipline
where programmers are habitually conscious and cautious about potential failures
and are more dilligent in managing them, leading to higher code quality overall.

## Don't we have linters and other static analysis tools to do this?

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

## Error messaging improvements

Traditional error handling in JavaScript often provides a singular, generic error message that encapsulates the issue at hand. However, with complex applications, understanding the root cause of an issue often requires context from various levels of your application stack. The Errors as Values approach facilitates this by enabling layered error messaging. As an error propagates up through the layers of your application, each layer can add its own context to the error message. This provides a detailed narrative of the error's journey through your application, making it easier to diagnose and resolve issues. For instance, instead of just receiving a high-level error such as `"Could not get git branches"` or receiving a low-level error message like `"File 'packed-refs' not found"`, you could receive an error message like `"Could not get git branches because: Could not read 'refs/heads' directory and: File 'packed-refs' not found"`. This layered, multi-level view into where and why an error occurred significantly improves error diagnosis and resolution.

# Examples

In this section, we'll illustrate the Errors as Values approach using practical,
real-world examples. Each example will be explained and contextualized, helping
you understand how the errors as values philosophy is applied and how it can
benefit you in various scenarios.

The examples will guide you on how to handle errors, how to propagate errors to
the caller functions, and how to use the helper functions. These examples will
also highlight the strengths of the errors as values approach, including its
explicit nature, better context in error messages, and robust error handling
mechanisms.

Keep in mind that these examples are merely a starting point. As you grow more
familiar with errors as values, you'll find that its principles can be applied
in many different situations, helping you to write cleaner, more reliable code.

## Reading a File and parsing the text as JSON for a configuration file

This example demonstrates how to read a JSON file using the errors as values
philosophy. Reading files is a common operation in many applications, but it's
also one where errors can frequently occur. A file might not exist, may lack
proper permissions, or its content could be improperly formatted.

Here's the function in the traditional error handling fashion.

```ts
function readConfigFile(filePath: string): Config {
  const fileContent = Deno.readTextFileSync(filePath);
  const jsonData = JSON.parse(fileContent);
  return jsonData as Config;
}
```

This is a very simple function, but many things can go wrong during the
operations of this function. Let's take a look at the errors as values version
of this function.

```ts
function readConfigFile(filePath: string): Config | Error {
  try {
    const fileContent = Deno.readTextFileSync(filePath);
    const jsonData = JSON.parse(fileContent);
    return jsonData as Config;
  } catch (error) {
    return error;
  }
}
```

This is the simplist way to implement errors as values in Typescript. You can
see that instead of expecting the caller of the function to catch the error, we
do it ourselves and return it as an error. Let's see what happens when we try to
use this function.

```ts
function loadConfig(): Config {
  let defaultConfig: Config = {
    token: "",
    repo: "",
  };
  const config = readConfigFile("./config.json");
  for (const key in config) {
    defaultConfig[key as keyof Config] = config[key as keyof Config];
  } //                                    /\
  return config; //       Element implicitly has an 'any' type because
  //                   expression of type 'keyof Config' can't be used
  //                                   to index type 'Error | Config'.
  //          Property 'token' does not exist on type 'Error | Config'.
}
```

Here our editor is telling us that config is a union type of "`Error | Config`",
which means that we need to handle the case in which this errors. We can do this
a couple of ways, but my favorite is called
[narrowing](https://www.typescriptlang.org/docs/handbook/2/narrowing.html).
Essentially we're checking if the return value of `readConfigFile` is an
`Error`, and if it is we're going to change our control flow to avoid trying to
use it like a `Config`.

Here's what that looks like.

```ts
function loadConfig(): Config {
  let defaultConfig: Config = {
    token: "",
    repo: "",
  };
  const config = readConfigFile("./config.json");
  if (config instanceof Error) { // here we check if readConfigFile errored
    return defaultConfig;
  }
  for (const key in config) {
    defaultConfig[key as keyof Config] = config[key as keyof Config];
  }
  return config;
}
```

Here we say that if the config file is an `Error`, we're going just return the
default config instead. Now this might handle the error, but it looks mighty
ugly and it's a litlte harder to read than what we're used to. So we have some
helper functions and types to make this easier for us.

Meet `Try`, no not that `try`, this `Try`. `Try` is a function that takes in
another function and wraps it in a `try/catch` block. This makes any function
have an interface that follows the errors as values paradigm. This is useful for
all the functions that currently do not follow the paradigm.

```ts
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
```

Here's an example of it's usage in our previous example.

```ts
function readConfigFile(filePath: string): Config | Error {
  const fileContent = Try(Deno.readTextFileSync)(filePath);
  const jsonData = Try(JSON.parse)(fileContent);
  return jsonData; //                  /\
  //             Argument of type 'string | Error' is not assignable
  //                                   to parameter of type 'string'.
  //                 Type 'Error' is not assignable to type 'string'.
}
```

As you can see we already get a type error when we implemented `Try` into our
function. This is good, it means we have an unhandled error afoot. Now we need
to handle these errors. In this case the function cannot continue if the file
content cannot be read, so we should use
[type narrowing](https://www.typescriptlang.org/docs/handbook/2/narrowing.html)
here to handle the error. We'll use another helper function here called `Err`.

```ts
export function Err(value: Result<any>): value is T {
  return value instanceof Error;
}
```

`Err` is very simple, it checks if the value is an `Error` and returns it as a
boolean.

```ts
function readConfigFile(filePath: string): Config | Error {
  const fileContent = Try(Deno.readTextFileSync)(filePath);
  if (Err(fileContent)) { // We're using Err to check if readTextFileSync errored
    return fileContent; // and if it did, we're going to return that error
  }
  const jsonData = Try(JSON.parse)(fileContent);
  return jsonData;
}
```

Now we're handling the read errors and passing them up, but this error isn't
very descriptive. We can use another helper function `ErrMsg` that lets us add
another message onto an error to make it more descriptive.

```ts
function readConfigFile(filePath: string): Config | Error {
  const fileContent = Try(Deno.readTextFileSync)(filePath);
  if (Err(fileContent)) {
    return ErrMsg(fileContent, "Failed to read config file"); // Now we're making it more
  } //                                       more clear that we're returning an Error and
  const jsonData = Try(JSON.parse)(fileContent); //     adding more detail to the message
  return jsonData;
}
```

We can also do the same to jsonData to make it more descriptive, but a more
detailed way to go about this. I'm sure you noticed with our `Err` helper we can also change our return type to use `Result`, which is just a union type between `Error` and `T`.

```ts
function readConfigFile(filePath: string): Result<Config> {
  const fileContent = Try(Deno.readTextFileSync)(filePath);
  if (Err(fileContent)) {
    return ErrMsg(fileContent, "Failed to read config file"); 
  }
  const jsonData = Try(JSON.parse)(fileContent);
  return jsonData;
}
```

Now let's go into some cooler ways we can change control flow with `Ok`. `Ok` says that "hey that value's ok" and is written to work with the `??` nullish coalescing operator. Here's what it is and example of how to use it.

```ts
export function Ok<T>(value: Result<T>): T | null {
  if(value instanceof Error) {
    return null;
  }
  return value;
}
```

Here we have eliminated one of the errors from our function by providing a default option for when it does fail by using the `Ok` function and the `??` nullish coalescing operator. If we can't read the file, we're going to return an Error. If we can't parse the JSON, we're going to return a blank object instead of an error.

```ts
function readConfigFile(filePath: string): Result<Config> {
  const fileContent = Try(Deno.readTextFileSync)(filePath);
  if (Err(fileContent)) {
    return ErrMsg(fileContent, "Failed to read config file"); 
  }
  const jsonData = Try(JSON.parse)(fileContent);
  return Ok(jsonData) ?? {};
}
```

I'll admit that this feature is much more useful for higher order functions like in this next example. This function has two ways of getting the information for Git branches, and if one fails it will back up to the other way.

```ts
export function getGitBranchesSync() {
  return Ok(getGitBranchesFromPackedRefsSync()) ??
    getGitBranchesFromBranchFilesSync()
}
```

Sometimes though you just need to throw an Error, or if you're prototyping you might not care about the error. For that I wrote `Unwrap`. It's a simple function that checks if the result is an `Error`, and if it is it will throw it. Otherwise it will return it. This can be useful sometimes.

```ts
export function Unwrap<T>(value: Result<T>): T {
  if(value instanceof Error) {
    throw value;
  }
  return value;
}
```

## Fetching User Data

In this example, we demonstrate how the Errors as Values (EaV) approach can provide greater control over the system's flow. If retrieving the cache fails, we attempt to access the primary DB. If this also fails, we turn to the backup DB. If all attempts fail, we return an error message indicating that all methods have failed. Each failure is also accompanied by a specific error message that can provide insights into why that particular method failed.

```ts
type User = {
  id: string;
  name: string;
  // ... other fields
}

function getUserData(userId: string): Result<User> {
  return Ok(getUserDataFromCache(userId)) ??
    Ok(getUserDataFromPrimaryDB(userId)) ??
    Ok(getUserDataFromBackupDB(userId)) ??
    new Error("Failed to get user data from all sources");
}

function getUserDataFromCache(userId: string): Result<User> {
  // suppose fetchDataFromCache can throw Error
  const data = Try(fetchDataFromCache)(userId);
  if (Err(data)) {
    return ErrMsg(data, "Could not fetch data from cache");
  }
  return data;
}

function getUserDataFromPrimaryDB(userId: string): Result<User> {
  // suppose fetchDataFromPrimaryDB can throw Error
  const data = Try(fetchDataFromPrimaryDB)(userId);
  if (Err(data)) {
    return ErrMsg(data, "Could not fetch data from primary database");
  }
  return data;
}

function getUserDataFromBackupDB(userId: string): Result<User> {
  // suppose fetchDataFromBackupDB can throw Error
  const data = Try(fetchDataFromBackupDB)(userId);
  if (Err(data)) {
    return ErrMsg(data, "Could not fetch data from backup database");
  }
  return data;
}
```

As shown, applying the Errors as Values paradigm to JavaScript and TypeScript can provide several advantages to our codebase. It makes error handling more explicit, improves code readability, enhances the debugging process, and promotes better code organization.

While the Errors as Values approach might seem unconventional and requires a shift in mindset, the benefits it provides make it a valuable addition to your coding toolkit. It's not about replacing every traditional try/catch with Errors as Values but about using the right tool for the job. Sometimes, a try/catch might be exactly what you need. Other times, Errors as Values might be a more appropriate choice.

We hope you find this guide useful, and that it contributes to the continual improvement of your codebase. Keep coding, and remember: explicit error handling makes your application more reliable and easier to maintain. Happy coding!

---

For more information, queries, or suggestions, please feel free to open an issue or submit a pull request. We're eager to hear from you!

---