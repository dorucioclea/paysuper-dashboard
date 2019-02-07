module.exports = {
  root: true,
  env: {
    browser: true,
    node: true
  },
  parserOptions: {
    parser: 'babel-eslint'
  },
  extends: [
    'airbnb-base',
    // https://github.com/vuejs/eslint-plugin-vue#priority-a-essential-error-prevention
    // consider switching to `plugin:vue/strongly-recommended` or `plugin:vue/recommended` for stricter rules.
    'plugin:vue/essential',
  ],
  // required to lint *.vue files
  plugins: [
    'vue'
  ],
  // add your custom rules here
  rules: {
    'no-param-reassign': ['error', { ignorePropertyModificationsFor: ['state'] }],
    'no-plusplus': 'off'
  },
  settings: {
    'import/resolver': {
      // We need this for eslint to understand ~ path aliases
      'nuxt-import': {}
    }
  }
}
