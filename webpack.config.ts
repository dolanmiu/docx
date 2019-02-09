// tslint:disable:no-object-literal-type-assertion
import * as path from "path";
import { Configuration } from "webpack";

module.exports = {
    entry: "./src/index.ts",

    output: {
        path: path.resolve("build"),
        filename: "index.js",
        libraryTarget: "umd",
    },

    resolve: {
        extensions: [".tsx", ".ts", ".js"],
        modules: [path.resolve("./src"), "node_modules"],
    },

    module: {
        rules: [
            {
                test: /\.ts$/,
                loaders: ["awesome-typescript-loader"],
            },
            // For coverage testing
            ...(process.env.NODE_ENV !== "production"
                ? [{
                    test: /\.(ts)/,
                    include: path.resolve("src"),
                    loader: "istanbul-instrumenter-loader",
                    enforce: "post",
                    exclude: [/node_modules/],
                }]
                : []
            )
        ],
    },

    // Because docx is now targetting web
    // target: 'node',
} as Configuration;
