const path = require('path');

module.exports = {
    entry: './src/index.ts',

    output: {
        path: path.resolve('build'),
        filename: 'index.js',
        library: true
    },

    resolve: {
        extensions: ['.tsx', '.ts', '.js']
    },

    module: {
        rules: [
            {
                test: /\.ts$/,
                loaders: ["awesome-typescript-loader"],
            }
        ],
    },

    target: 'node'
};
