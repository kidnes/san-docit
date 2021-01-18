const path = require('path');
const webpack = require('webpack');
const {default: merge} = require('webpack-merge');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const SanLoaderPlugin = require('san-loader/lib/plugin');
const utils = require('./utils');

module.exports = function () {
    const config = require('./config').load();

    const replaceLoader = require('./replace-loader');

    const webpackConfig = {
        devtool: '',
        mode: 'development',
        context: __dirname,
        output: {
            path: utils.resolveDocit('dist'),
            filename: 'static/js/[name].js',
            chunkFilename: 'static/js/[name].js',
            publicPath: config.base
        },
        optimization: {
            splitChunks: {
                cacheGroups: {
                    vendors: {
                        name: 'chunk-vendors',
                        test: /[\\/]node_modules[\\/]/,
                        priority: -10,
                        chunks: 'initial'
                    },
                    common: {
                        name: 'chunk-common',
                        minChunks: 2,
                        priority: -20,
                        chunks: 'initial',
                        reuseExistingChunk: true
                    }
                }
            }
        },
        module: {
            rules: [
                {
                    test: /\.js$/,
                    exclude: /node_modules/,
                    use: 'babel-loader'
                },
                {
                    test: /\.san$/,
                    use: 'san-loader'
                },
                {
                    test: /\.(png|jpe?g|gif|svg|woff2?|eot|ttf|otf)(\?.*)?$/,
                    use: [
                        {
                            loader: 'url-loader',
                            options: {
                                limit: 10000,
                                fallback: {
                                    loader: 'file-loader',
                                    options: {
                                        name: 'static/img/[name].[ext]'
                                    }
                                }
                            }
                        }
                    ]
                },
                {
                    test: /\.css$/,
                    use: ['style-loader', 'css-loader']
                },
                {
                    test: /\.less$/,
                    use: [
                        'style-loader',
                        'css-loader', 
                        {
                            loader: 'less-loader',
                            options: {
                                sourceMap: false
                            }
                        }
                    ]
                },
                {
                    test: /\.html$/,
                    loader: 'html-loader'
                },
                {
                    test: /\.md$/,
                    use: ['san-loader', '../packages/markdown-loader']
                }
            ].concat(replaceLoader())
        },
        resolve: {
            extensions: ['.js', '.jsx', '.san', '.json']
        },
        plugins: [
            new SanLoaderPlugin(),
            new CopyWebpackPlugin({
                patterns: utils.getCommonDirs('public').map(dir => ({
                    from: dir,
                    to: utils.resolveDocit('dist')
                }))
            }),
            new webpack.DefinePlugin({
                'process.env': {
                    SAN_DOCIT: JSON.stringify(config),
                    BASE_URL: `"${config.base}"`
                }
            }),
            new webpack.ProgressPlugin({
                profile: false
            })
        ]
    };

    if (typeof config.configureWebpack === 'function') {
        const customConfig = config.configureWebpack(webpackConfig);
        if (customConfig) {
            webpackConfig = merge(webpackConfig, customConfig);
        }
    }

    return webpackConfig;
};
