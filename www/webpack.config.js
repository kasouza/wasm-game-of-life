const HtmlWebpackPlugin = require('html-webpack-plugin');
const path = require('path');

module.exports = {
    entry: './bootstrap.js',
    mode: 'development',
    devServer: {
        contentBase: './dist',
    },
    output: {
        filename: 'index_bundle.js',
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
            },
			{
				test: /\.css$/i,
				use: ['style-loader', 'css-loader'],
			},
        ],
    },
	plugins: [new HtmlWebpackPlugin()]
};
