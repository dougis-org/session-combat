import nextConfig from "eslint-config-next";
import nextPlugin from "@next/eslint-plugin-next";

const eslintConfig = [
  ...nextConfig,
  {
    name: "next/core-web-vitals-overrides",
    rules: nextPlugin.configs["core-web-vitals"].rules,
  },
];

export default eslintConfig;
