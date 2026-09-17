import { AfterAll, Before, setDefaultTimeout } from '@cucumber/cucumber';
import { closeBrowser } from './browser.js';
import type { BecampWorld } from './world.js';

/* A cold build is a couple of seconds; the first scenario in a worker pays for
   it, and several scenarios may each want a different configuration. */
setDefaultTimeout(120_000);

Before(function (this: BecampWorld) {
  this.buildOptions = {};
  this.site = undefined;
  this.document = undefined;
  this.currentPage = undefined;
  this.request = {};
  this.endpointEnv = undefined;
  this.endpointStubs = {};
  this.response = undefined;
  this.scratch = {};
});

/* One browser and one static server per worker, torn down at the end. */
AfterAll(async function () {
  await closeBrowser();
});
