module.exports = {
  ownBackendUrl: {
    name: 'VUE_APP_BACKEND_DOMAIN',
    default: 'http://localhost:8080',
  },
  apiUrl: {
    name: 'VUE_APP_P1PAYAPI_URL',
    default: 'https://p1payapi.tst.protocol.one',
  },
  websocketUrl: {
    name: 'VUE_APP_WEBSOCKET_URL',
    default: 'wss://cf.tst.protocol.one/connection/websocket',
  },
  paysuperJsSdkUrl: {
    name: 'PAYSUPER_JS_SDK_URL',
    default: 'https://cdn.pay.super.com/paysdk/dev/paysuper.js',
  },
};
