import WebFont from "webfontloader";
import { defineNuxtPlugin } from '#app';

export default defineNuxtPlugin(() => {
  WebFont.load({
    google: {
      families: ["Open Sans:700"],
    },
  });
});
