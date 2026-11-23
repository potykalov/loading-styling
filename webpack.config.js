import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import webpack from "webpack";
import HtmlWebpackPlugin from "html-webpack-plugin";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class ServiceWorkerPlugin {
  apply(compiler) {
    compiler.hooks.thisCompilation.tap("ServiceWorkerPlugin", (compilation) => {
      compilation.hooks.processAssets.tap(
        {
          name: "ServiceWorkerPlugin",
          stage: webpack.Compilation.PROCESS_ASSETS_STAGE_REPORT,
        },
        () => {
          const precacheAssets = compilation
            .getAssets()
            .map(({ name }) => name)
            .filter((name) =>
              /\\.(?:html|js|css|svg|png|jpe?g|webp|ico|woff2?)$/i.test(name),
            )
            .filter((name) => name !== "service-worker.js")
            .map((name) => `./${name}`);

          const serviceWorkerTemplate = fs.readFileSync(
            path.resolve(__dirname, "src/service-worker.js"),
            "utf8",
          );

          const serviceWorker = serviceWorkerTemplate.replace(
            "__PRECACHE_MANIFEST__",
            JSON.stringify(precacheAssets),
          );

          compilation.emitAsset(
            "service-worker.js",
            new webpack.sources.RawSource(serviceWorker),
          );
        },
      );
    });
  }
}

export default (env, argv) => {
  const isProduction = argv.mode === "production";
  const configuredApiUrl = process.env.API_URL?.trim();

  if (isProduction && !configuredApiUrl) {
    throw new Error(
      "Не задан API_URL. Добавьте URL backend из Render в GitHub Secrets с именем API_URL.",
    );
  }

  const apiUrl = (
    configuredApiUrl || "http://localhost:3000"
  ).replace(/\\/+$/, "");

  return {
    entry: "./src/js/index.js",

    output: {
      path: path.resolve(__dirname, "dist"),
      filename: "js/[name].[contenthash].js",
      clean: true,
      publicPath: "./",
    },

    devtool: isProduction ? false : "source-map",

    module: {
      rules: [
        {
          test: /\\.css$/i,
          use: ["style-loader", "css-loader"],
        },
      ],
    },

    plugins: [
      new HtmlWebpackPlugin({
        template: "./src/index.html",
      }),

      new webpack.DefinePlugin({
        "process.env.API_URL": JSON.stringify(apiUrl),
      }),

      new ServiceWorkerPlugin(),
    ],

    devServer: {
      static: {
        directory: path.resolve(__dirname, "dist"),
      },
      port: "auto",
      open: true,
      hot: true,
      historyApiFallback: true,
    },

    performance: {
      hints: false,
    },
  };
};
