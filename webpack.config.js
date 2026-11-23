import path from "node:path";
import { fileURLToPath } from "node:url";
import webpack from "webpack";
import HtmlWebpackPlugin from "html-webpack-plugin";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default (env, argv) => {
  const isProduction = argv.mode === "production";

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
          test: /\.css$/i,
          use: ["style-loader", "css-loader"],
        },
      ],
    },

    plugins: [
      new HtmlWebpackPlugin({
        template: "./src/index.html",
      }),

      new webpack.DefinePlugin({
        "process.env.API_URL": JSON.stringify(
          process.env.API_URL || "http://localhost:3000",
        ),
      }),
    ],

    devServer: {
      static: {
        directory: path.resolve(__dirname, "dist"),
      },
      port: 8080,
      open: true,
      hot: true,
      historyApiFallback: true,
    },

    performance: {
      hints: false,
    },
  };
};
