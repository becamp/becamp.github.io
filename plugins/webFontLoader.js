import WebFont from "webfontloader";

export default defineNuxtPlugin(() => {
  WebFont.load({
    google: {
      families: ["Open Sans:700"],
    },
  });
});
