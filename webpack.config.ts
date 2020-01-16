// tslint:disable:no-object-literal-type-assertion
import * as path from "path";
import { Configuration } from "webpack";

const serverConfig = {
    entry: "./src/index.ts",

    output: {
        path: path.resolve("build"),
        filename: "index.js",
        libraryTarget: "umd",
        library: "docx",
    },

    resolve: {
        extensions: [".tsx", ".ts", ".js"],
        modules: [path.resolve("./src"), "node_modules"],
    },

    module: {
        rules: [
            {
                test: /\.ts$/,
                loaders: ["ts-loader"],
            },
            // For coverage testing
            ...(process.env.NODE_ENV !== "production"
                ? [
                      {
                          test: /\.(ts)/,
                          include: path.resolve("src"),
                          loader: "istanbul-instrumenter-loader",
                          enforce: "post",
                          exclude: [/node_modules/],
                      },
                  ]
                : []),
        ],
    },

    target: "node",
} as Configuration;

const clientConfig = {
    entry: "./src/index.ts",

    output: {
        path: path.resolve("build"),
        filename: "index.web.js",
        libraryTarget: "umd",
        library: "docx",
    },

    resolve: {
        extensions: [".tsx", ".ts", ".js"],
        modules: [path.resolve("./src"), "node_modules"],
    },

    module: {
        rules: [
            {
                test: /\.ts$/,
                loaders: ["ts-loader"],
            },
            // For coverage testing
            ...(process.env.NODE_ENV !== "production"
                ? [
                      {
                          test: /\.(ts)/,
                          include: path.resolve("src"),
                          loader: "istanbul-instrumenter-loader",
                          enforce: "post",
                          exclude: [/node_modules/],
                      },
                  ]
                : []),
        ],
    },
} as Configuration;

module.exports = [serverConfig, clientConfig];
