# Koa Static
A class for creating Koa middlewares that serve files from one or more directories.

This middleware is built on top of [koa-static-cache](https://www.npmjs.com/package/koa-static-cache).

## Installation
Install the package with NPM:

```
npm install @donutteam/koa-static
```

## Usage
To use this class, simply instantiate an instance and add it to your Koa stack:

```js
import Koa from "koa";

import { StaticMiddleware } from "@donutteam/koa-static";

const app = new Koa();

const staticMiddleware = new StaticMiddleware(
	{
		dirs:
		[
			// ...
		],
	});

// Be sure to add the execute function on the instance
// and NOT the instance itself
app.use(staticMiddleware.execute);
```

## Options
### dirs
Specify one or more directories to serve static files from. Later entries will override earlier ones.

You must specify at least one path.

```js
import { StaticMiddleware } from "@donutteam/koa-static";

import { path } from "node:path";

const staticMiddleware = new StaticMiddleware(
	{
		dirs:
		[
			// Maybe you have a package that just contains shared static assets?
			path.join(process.cwd(), "node_modules", "@scope", "static", "public"),

			// Serve from the "public" folder in the app's working directory
			// Files in this folder will override files in any previous folders
			path.join(process.cwd(), "public"),	
		],
	});
```

### koaStaticCache
An object containing options for the underlying [koa-static-cache](https://www.npmjs.com/package/koa-static-cache) instance(s).

See [this document](https://www.npmjs.com/package/koa-static-cache#staticcachedir--options--files) for more details.

## Methods
### getCacheBustedPath
This returns the path to the given asset with a cache buster query parameter appended to it.

If the file does not exist in any of the static directories, the path will be returned as is.

```js
const cacheBustedPath = staticMiddleware.getCacheBustedPath("/index.css");

// Returns: /index.css?mtime=1657678626915
```

## License
[MIT](https://github.com/donutteam/koa-static/blob/main/LICENSE.md)