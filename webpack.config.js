const path = require('path');

module.exports = {
	mode: 'production',
	entry: './src/index.js',
	output: {
		path: path.resolve(__dirname, 'public'),
		filename: 'zoo.js',
	},
	performance: {
		maxEntrypointSize: 1024000,
		maxAssetSize: 1024000,
	},
	module: {
		rules: [
			{ test: /\.txt$/, use: 'raw-loader' },
			{
				test: /\.js$/,
				exclude:  /node_modules\/(?!cannon-es).*/,
				use: {
					loader: "babel-loader",
					options: {
						plugins: [
							"@babel/plugin-proposal-class-properties"
						]
					}
				}
			}
		],
	},
	devServer: {
		stats: {
			hash: false,
			version: false,
			timings: false,
			assets: false,
			chunks: false,
			modules: false,
		},
		publicPath: '/public/',
		compress: true,
		port: 7171,
		hot: true,
	},
}
