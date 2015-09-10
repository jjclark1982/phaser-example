var webpack = require('webpack');

var config = {
    context: __dirname,
    entry: {
        main: ['./src/main']
    },
    output: {
        path: __dirname+'/public',
        filename: '[name]-bundle.js'
    },
    resolveLoader: {
        modulesDirectories: ['web_modules','node_modules']
    },
    resolve: {
        extensions: ['', '.js', '.coffee']
    },
    module: {
        loaders: [
            { test: /\.coffee$/i, loader: 'coffee-loader' },
            { test: /\.frag$/i, loader: 'phaser-glsl-loader' },
            { test: /\.json$/i, loader: 'json-loader' },
            { test: /\.(jpe?g|png|gif)$/i, loader: "file?name=[path][name].[ext]?[hash]" },
            { test: /\.(mp3|ac3|ogg|m4a)$/i, loader: "file?name=[path][name].[ext]?[hash]" },
            { test: /\.(ttf|woff|eot)$/i, loader: "file?name=[path][name].[ext]?[hash]" }
        ]
    },
    plugins: [
        new webpack.NoErrorsPlugin(),
        new webpack.optimize.DedupePlugin()
    ],
    devtool: 'source-map',
    target: 'web',
    node: {
        fs: 'empty'
    }
};

// webpack-dev-server configuration
if (require.cache[require.resolve('webpack-dev-server')]) {
    config.devServer = {
        host: process.env.HOST || 'localhost',
        port: process.env.PORT || '8080',
        contentBase: config.output.path,
        publicPath: '/',
        hot: true,
        stats: { colors: true }
    };
    // we appear to be running the dev server. enable hot reloading.
    for (var i in config.entry) {
        config.entry[i].push('webpack/hot/dev-server');
        config.entry[i].push('webpack-dev-server/client?http://'+config.devServer.host+':'+config.devServer.port)
    }
    config.plugins.push(new webpack.HotModuleReplacementPlugin());
}

module.exports = config;
