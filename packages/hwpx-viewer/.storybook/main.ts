import type { StorybookConfig } from "@storybook/html-webpack5";

const config: StorybookConfig = {
  stories: ["../stories/**/*.stories.@(js|ts)"],
  addons: ["@storybook/addon-essentials"],
  framework: {
    name: "@storybook/html-webpack5",
    options: {},
  },
  staticDirs: [
    // 웹사이트의 샘플 hwp 파일을 그대로 노출
    // { from: "assets", to: "/assets" },
    "./assets",
  ],
  webpackFinal: async (baseConfig) => {
    baseConfig.module?.rules?.push({
      test: /\.tsx?$/,
      exclude: /node_modules/,
      use: [
        {
          loader: require.resolve("ts-loader"),
          options: {
            transpileOnly: true,
          },
        },
      ],
    });
    baseConfig.resolve = baseConfig.resolve || {};
    baseConfig.resolve.extensions = [
      ...(baseConfig.resolve.extensions || []),
      ".ts",
      ".tsx",
    ];
    return baseConfig;
  },
};

export default config;
