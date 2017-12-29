const path = require('path');

module.exports = {
    entry: './src/index.ts',

    output: {
        path: path.resolve('build'),
        filename: 'index.js',
        library: 'docx',
        libraryTarget: 'umd'
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

    target: 'node',

    node: {
        __dirname: true
    }
};
