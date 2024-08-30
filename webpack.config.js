const CopyPlugin = require('copy-webpack-plugin');
const path = require('path');

module.exports = {
	mode: "production",
	entry: './main.js',
	output: {
		filename: 'main.js',
		path: path.resolve(__dirname, '../../live/bounder'),
		chunkFilename: '[chunkhash].js',
		clean: true,
		publicPath: ''
	},
	plugins: [
		new CopyPlugin({
			patterns: [
				// { from: '../three.js/examples/models/gltf/collision-world.glb', to: 'models/gltf/collision-world.glb' },
				{ from: 'index.html', to: 'index.html' }
			]
		})
	],
	resolve: {
		alias: {
			three$: path.resolve(__dirname, '../three.js/src/Three.js'),
			'three/addons': path.resolve(__dirname, '../three.js/examples/jsm')
		}
	}
};
