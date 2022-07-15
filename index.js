//
// Imports
//

import fs from "node:fs";
import path from "node:path";

import koaStaticCache from "koa-static-cache";

//
// Static Middleware
//

/**
 * A class for creating middleware's that serve static files.
 *
 * This uses koa-static-cache under the hood and just simplifies serving multiple directories with it.
 */
export class StaticMiddleware
{
	/**
	 * This middleware's array of directories to serve static assets from.
	 * 
	 * @type {Array<String>}
	 */
	dirs = [];

	/**
	 * The middleware function.
	 * 
	 * @type {import("koa").Middleware}
	 */
	execute;

	/**
	 * The files object shared by all of the underlying koa-static-cache instances.
	 * 
	 * @type {Object<string, string>}
	 */
	files = {};

	/**
	 * Constructs a new StaticMiddleware.
	 *
	 * @param {Object} options Options for the middleware.
	 * @param {Array<String>} options.dirs
	 * @param {import("koa-static-cache").Options} [options.koaStaticCache] Options for the underlying koa-static-cache instances. Note that the "dir" and "files" options will be ignored.
	 * @author Loren Goodwin
	 */
	constructor(options)
	{
		//
		// Options
		//

		if (options == undefined)
		{
			options = {};
		}

		if (options.dirs == undefined)
		{
			console.log("[StaticMiddleware] No directories were given to the constructor, this middleware will do nothing!");

			options.dirs = [];
		}

		if (options.koaStaticCache == undefined)
		{
			options.koaStaticCache = {};
		}

		if (options.koaStaticCache.dynamic == undefined)
		{
			options.koaStaticCache.dynamic = process.env.NODE_ENV != "production";
		}

		if (options.koaStaticCache.gzip == undefined)
		{
			options.koaStaticCache.gzip = true;
		}

		if (options.koaStaticCache.maxAge == undefined)
		{
			options.koaStaticCache.maxAge = 365 * 24 * 60 * 60;
		}

		//
		// Initialise Middlewares
		//

		this.dirs = options.dirs;

		if (options.dirs.length > 0)
		{
			for (const [ dirIndex, dir ] of options.dirs.entries())
			{
				const middleware = koaStaticCache(
					{
						...options.koaStaticCache,
						files: this.files,
						dir,
					});

				if (dirIndex == options.dirs.length - 1)
				{
					this.execute = middleware;
				}
			}
		}
		else
		{
			this.execute = async (context, next) =>
			{
				await next();
			};
		}
	}

	/**
	 * Appends a cache buster to the given asset path.
	 * 
	 * @param {String} assetPath A relative path to a static asset.
	 * @returns {String} The same path with a cache buster appended. If the file does not exist in any static directories, it will be returned as is.
	 * @author Loren Goodwin
	 */
	getCacheBustedPath(assetPath)
	{
		for (const staticPath of this.dirs)
		{
			const onDiskPath = path.join(staticPath, assetPath);

			try
			{
				// HACK: Don't use statSync here
				const stats = fs.statSync(onDiskPath);

				let modifiedTimestamp = stats.mtime.getTime();

				return assetPath + "?mtime=" + modifiedTimestamp.toString();
			}
			catch (error)
			{
				// Note: Doesn't matter if this fails, that just means it doesn't exist.
			}
		}

		return assetPath;
	}
}