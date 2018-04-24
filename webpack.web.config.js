const path = require('path');

module.exports = {
    entry: './src/index.ts',

    output: {
        path: path.resolve('build'),
        filename: 'index.web.js',
        libraryTarget: 'umd'
    },

    resolve: {
        extensions: ['.tsx', '.ts', '.js'],
        modules: [path.resolve('./src'), "node_modules"]
    },

    module: {
        rules: [
            {
                test: /\.ts$/,
                loaders: ["awesome-typescript-loader"],
            }
        ],
    },

    node: {
        __dirname: true,
        fs: "empty",
        tls: "empty",
        net: "empty"
    }
};
