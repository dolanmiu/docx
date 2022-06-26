const path = require("path");
const { ProvidePlugin } = require("webpack");
const TsconfigPathsPlugin = require("tsconfig-paths-webpack-plugin");

const configuration = {
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
        plugins: [new TsconfigPathsPlugin()],
    },

    module: {
        rules: [
            {
                test: /\.ts$/,
                loader: "ts-loader",
                options: {
                    configFile: "tsconfig.lib.json",
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
