/* The scenario's scratch space. Steps written by different areas share this
   shape, so a Given from the common steps can be observed by a Then anywhere. */

import { setWorldConstructor, World, type IWorldOptions } from '@cucumber/cucumber';
import type { BuildOptions, BuiltSite } from './build.js';
import type { EndpointEnv, EndpointResult, EndpointRequest, EndpointStubs } from './endpoint.js';

export class BecampWorld extends World {
  /** Build configuration accumulated by Given steps, consumed on first render. */
  buildOptions: BuildOptions = {};
  /** The built site, once a step has asked for one. */
  site?: BuiltSite;
  /** The page a Then step should assert against. */
  document?: Document;
  currentPage?: string;

  /** Registration endpoint state. */
  request: EndpointRequest = {};
  endpointEnv?: EndpointEnv;
  endpointStubs: EndpointStubs = {};
  response?: EndpointResult;

  /** Free-form slot for area-specific steps. */
  scratch: Record<string, any> = {};

  constructor(opts: IWorldOptions) {
    super(opts);
  }
}

setWorldConstructor(BecampWorld);
