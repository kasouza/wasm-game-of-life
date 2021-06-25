const path = require('path');

module.exports = {
    entry: './bootstrap.js',
    mode: "development",
    devServer: {
        contentBase: './dist',
    },
    output: {
        filename: 'main.js',
        path: path.resolve(__dirname, 'dist'),
    },
    experiments: {
        asyncWebAssembly: true,
    },
    module: {
        rules: [
            {
                test: /\.(vert|frag)/,
                type: 'asset/source',
            }
        ],
    },
};
