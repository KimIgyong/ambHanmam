const path = require('path');
const nodeExternals = require('webpack-node-externals');

module.exports = function (options) {
  return {
    ...options,
    externals: [
      nodeExternals({
        modulesDir: path.resolve(__dirname, '../../node_modules'),
        allowlist: [/^@amb\//],
      }),
      nodeExternals({
        modulesDir: path.resolve(__dirname, 'node_modules'),
        allowlist: [/^@amb\//],
      }),
    ],
    module: {
      rules: [
        {
          test: /\.ts$/,
          use: [
            {
              loader: 'ts-loader',
              options: {
                transpileOnly: true,
                configFile: path.resolve(__dirname, 'tsconfig.json'),
              },
            },
          ],
          include: [
            path.resolve(__dirname, 'src'),
            path.resolve(__dirname, '../../packages'),
          ],
        },
      ],
    },
    resolve: {
      ...options.resolve,
      extensions: ['.ts', '.js', '.json'],
    },
  };
};
