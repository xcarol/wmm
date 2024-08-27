/* eslint-env node */
require("@rushstack/eslint-patch/modern-module-resolution");

module.exports = {
  root: true,
  extends: [
    "eslint:recommended",
    "plugin:import/recommended",
    "plugin:node/recommended",
    "plugin:prettier/recommended",
  ],

  plugins: ["import", "node", "promise", "prettier"],

  rules: {
    "max-len": 0,
    "no-underscore-dangle": "off",
    "no-console": process.env.NODE_ENV === "production" ? "error" : "off",
    "no-debugger": process.env.NODE_ENV === "production" ? "error" : "off",
    "promise/always-return": "error",
    "promise/no-return-wrap": "error",
    "prettier/prettier": "error",
    "node/no-missing-import": "off",
    "import/no-unresolved": "error",
    "import/extensions": [
      "error",
      "always",
      {
        js: "never",
      },
    ],
    "arrow-parens": ["error", "always"],
    "comma-dangle": ["error", "always-multiline"],
    semi: ["error", "always"],
  },
  parserOptions: {
    ecmaVersion: "latest",
    sourceType: "module",
  },
};
