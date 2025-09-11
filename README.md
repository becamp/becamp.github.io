# be.Camp

Open source website for https://be.camp.

<img src="https://raw.githubusercontent.com/wearebraid/be.camp/master/static/beCampLogo1.png" width="250">

### Pull requests and issue reports are welcomed.

beCamp is a Charlottesville tech conference planned by the people who show up. On the evening prior to the conference, attendees socialize over food and drink, nominate topics they would like to present on or see discussed during the conference, and then cast their votes. You don't need to be an expert in a subject to suggest it for discussion! After topics have been voted on, volunteers (this could be you) dive in and arrange the schedule for the day of the conference.

[You can learn more about the Unconference movement here](https://en.wikipedia.org/wiki/Unconference).

## Build Setup

```bash
# install dependencies
$ npm install

# serve with hot reload at localhost:3000
$ npm run dev

# build for production
$ npm run build

# preview production build locally
$ npm run preview

# generate static copy of project
$ npm run generate

# generate static copy with local environment
$ npm run generate:local

# run linter
$ npm run lint

# run linter with auto-fix
$ npm run lint:fix

# run type checking
$ npm run typecheck
```

## Technology Stack

This project is built with:
- **Nuxt 3** - The Vue.js framework
- **Vue 3** - JavaScript framework with TypeScript support
- **Pinia** - State management
- **@nuxt/image** - Optimized image handling
- **SCSS/Sass** - CSS preprocessing
- **TypeScript** - Type safety
- **ESLint** - Code linting

## 3rd-Party APIs

This iteration of the beCamp website pulls data from [ButterCMS](https://buttercms.com) and [Airtable](https://airtable.com) to populate site content. For API access, you can message `@andrew` in the `#becamp` channel on [Cville Slack](http://bit.ly/slack-cville).

To connect to the APIs, you will need to create a `.env` file in the project root directory and add the API keys in the following format:

```
BUTTERKEY=<your-butter-key>
AIRTABLEKEY=<your-airtable-key>
```

**never commit your API keys to the project history. the `.env` file is gitignored by default.**

## Development

This project uses:
- **Node.js 20.17.0** (managed via Volta)
- **Nuxt 3.13.2** with TypeScript configuration
- **ESLint** for code quality
- Pre-commit hooks for code validation

## Docs

This project is built on Nuxt 3, the intuitive Vue framework. For detailed documentation:
- [Nuxt 3 Documentation](https://nuxt.com/docs)
- [Vue 3 Documentation](https://vuejs.org/)
