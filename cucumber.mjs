/* paths is intentionally absent: it would override a path given on the command
   line, so `npm run test:bdd -- docs/bdd/one.feature` could not focus a run.
   The default path lives in the npm script instead.

   import lists only the files that register world, hooks or steps. A broad
   tests/bdd/**\/*.ts glob would also load build-worker.ts, which is a CLI
   entrypoint and runs on import. */
export default {
  import: [
    'tests/bdd/support/world.ts',
    'tests/bdd/support/hooks.ts',
    'tests/bdd/steps/**/*.ts',
  ],
  format: ['summary', 'progress'],
  formatOptions: { snippetInterface: 'async-await' },
  /* Scenarios the suite cannot honestly automate are tagged rather than
     silently passing. See docs/bdd/README.md. */
  tags: 'not @manual',
};
