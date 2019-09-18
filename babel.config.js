module.exports = {
  presets: [
    ['@vue/app', { useBuiltIns: 'entry' }],
    ['@babel/preset-env', { useBuiltIns: 'usage', corejs: 3 }],
  ],
  plugins: ['@babel/plugin-syntax-dynamic-import'],
  // This somehow fixes jest --coverage brakedown
  env: {
    test: {},
  },
};
