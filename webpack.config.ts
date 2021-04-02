import * as path from "path";
import { Configuration, ProvidePlugin } from "webpack";

const configuration: Configuration = {
    mode: "production",

    entry: "./src/index.ts",

    output: {
        path: path.resolve("build"),
        filename: "index.js",
        libraryTarget: "umd",
        library: "docx",
        globalObject: "this",
    },

    resolve: {
        extensions: [".ts", ".js"],
        modules: [path.resolve("./src"), "node_modules"],
        fallback: {
            buffer: require.resolve("buffer"),
            stream: require.resolve("stream-browserify"),
        },
    },

    module: {
        rules: [
            {
                test: /\.ts$/,
                loader: "ts-loader",
                options: {
                    configFile: "tsconfig.json",
                },
            },
        ],
    },

    plugins: [
        // fix "process is not defined" error
        new ProvidePlugin({
            process: "process/browser",
        }),
    ],
};

module.exports = configuration;
