const HtmlWebpackPlugin = require('html-webpack-plugin');
const CopyPlugin = require('copy-webpack-plugin');
const path = require('path');

module.exports = {
	mode: "production",
	entry: './main.js',
	output: {
		filename: '[chunkhash].js',
		path: path.resolve(__dirname, '../../live/bounder'),
		chunkFilename: '[chunkhash].js',
		clean: true,
		publicPath: ''
	},
	plugins: [
		new CopyPlugin({
			patterns: [
				{ from: '../three.js/examples/textures/equirectangular/quarry_01_1k.hdr', to: 'textures/equirectangular/quarry_01_1k.hdr' }
			]
		}),
		new HtmlWebpackPlugin({
			title: "Bounder"
		})
	],
	resolve: {
		alias: {
			three$: path.resolve(__dirname, '../three.js/src/Three.js'),
			'three/addons': path.resolve(__dirname, '../three.js/examples/jsm')
		}
	}
};
