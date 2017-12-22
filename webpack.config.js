const path = require('path');
const { TsConfigPathsPlugin } = require('awesome-typescript-loader');

module.exports = {
    entry: './src/index.ts',

    output: {
        path: path.resolve('build'),
        filename: 'bundle.js'
    },

    resolve: {
        extensions: ['.ts', '.tsx', '.js'],
        plugins: [
            new TsConfigPathsPlugin(/* { configFileName, compiler } */)
        ]
    },

    // Source maps support ('inline-source-map' also works)
    devtool: 'source-map',

    module: {
        rules: [
            {
                test: /\.ts|\.tsx$/,
                loader: 'awesome-typescript-loader',
                exclude: [/^(?!.*\.spec\.ts$).*\.ts$/]
            }
        ]
    },
};
