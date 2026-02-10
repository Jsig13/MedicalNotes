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

import type * as dictionary from "../dictionary.js";
import type * as encounters from "../encounters.js";
import type * as notes from "../notes.js";
import type * as providers from "../providers.js";
import type * as templates from "../templates.js";
import type * as transcripts from "../transcripts.js";
import type * as voiceProfiles from "../voiceProfiles.js";

/**
 * A utility for referencing Convex functions in your app's API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
declare const fullApi: ApiFromModules<{
  dictionary: typeof dictionary;
  encounters: typeof encounters;
  notes: typeof notes;
  providers: typeof providers;
  templates: typeof templates;
  transcripts: typeof transcripts;
  voiceProfiles: typeof voiceProfiles;
}>;
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;
