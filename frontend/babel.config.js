module.exports = function(api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      function({ types: t }) {
        return {
          visitor: {
            Import(path) {
              const callExpr = path.parentPath;
              if (callExpr.isCallExpression()) {
                const arg = callExpr.node.arguments[0];
                if (!t.isStringLiteral(arg)) {
                  callExpr.replaceWith(
                    t.callExpression(
                      t.memberExpression(
                        t.identifier('Promise'),
                        t.identifier('resolve')
                      ),
                      [t.nullLiteral()]
                    )
                  );
                }
              }
            }
          }
        };
      },
      'react-native-reanimated/plugin'
    ]
  };
};
