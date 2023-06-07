//
// Imports
//

import fs from "node:fs";
import path from "node:path";

import type { Middleware } from "koa";
import koaStaticCache from "koa-static-cache";

//
// Static Middleware
//

export interface StaticMiddlewareOptions
{
	/** The directories to serve static assets from. */
	dirs: string[];

	/** Options for the underlying koa-static-cache instances. Note that the "dir" and "files" options will be ignored. */
	koaStaticCache?: koaStaticCache.Options;
}

/**
 * A class for creating middleware's that serve static files.
 *
 * This uses koa-static-cache under the hood and just simplifies serving multiple directories with it.
 */
export class StaticMiddleware
{
	/** This middleware's array of directories to serve static assets from. */
	dirs : string[] = [];

	/**
	 * The middleware function.
	 * 
	 * @type {import("koa").Middleware}
	 */
	execute : Middleware;

	/** The files object shared by all of the underlying koa-static-cache instances. */
	files : koaStaticCache.Files = {};

	/**
	 * Constructs a new StaticMiddleware.
	 *
	 * @author Loren Goodwin
	 */
	constructor(options : StaticMiddlewareOptions)
	{
		//
		// Options
		//

		options.koaStaticCache ??= {};

		options.koaStaticCache.dynamic ??= process.env.NODE_ENV != "production";

		options.koaStaticCache.gzip ??= true;

		options.koaStaticCache.maxAge ??= 365 * 24 * 60 * 60;

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