const baseConfig = require('@system-ui-js/development-base/.eslintrc.cjs')

module.exports = {
  ...baseConfig,
  plugins: ['jsx-a11y', 'sonarjs', 'prettier']
}
