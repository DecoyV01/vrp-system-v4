/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";
import type * as auth from "../auth.js";
import type * as datasets from "../datasets.js";
import type * as jobs from "../jobs.js";
import type * as locations from "../locations.js";
import type * as optimizerValidation from "../optimizerValidation.js";
import type * as projects from "../projects.js";
import type * as routes from "../routes.js";
import type * as scenarios from "../scenarios.js";
import type * as tasks from "../tasks.js";
import type * as validation from "../validation.js";
import type * as vehicles from "../vehicles.js";

/**
 * A utility for referencing Convex functions in your app's API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
declare const fullApi: ApiFromModules<{
  auth: typeof auth;
  datasets: typeof datasets;
  jobs: typeof jobs;
  locations: typeof locations;
  optimizerValidation: typeof optimizerValidation;
  projects: typeof projects;
  routes: typeof routes;
  scenarios: typeof scenarios;
  tasks: typeof tasks;
  validation: typeof validation;
  vehicles: typeof vehicles;
}>;
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;
