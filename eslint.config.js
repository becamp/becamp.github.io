import { createConfigForNuxt } from "@nuxt/eslint-config";

export default createConfigForNuxt({
  // options here
}).append([
  {
    ignores: [
      "static/**",
      "previous_years/**",
      "dist/**",
      ".nuxt/**",
      "node_modules/**",
    ],
  },
  {
    rules: {
      // Custom rules can be added here
      "vue/multi-word-component-names": "off",
      "vue/no-multiple-template-root": "off",
    },
  },
]);
