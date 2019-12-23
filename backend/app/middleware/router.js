const Router = require('koa-router');

const config = require('../../config/config');
const webappConfig = require('../../config/webappConfig');

const auth1Middleware = require('./auth1.oauth2');
const { uploadFile } = require('./s3-upload');

const router = new Router({
  prefix: config.routesPrefix,
});

const { auth1RoutesNamespace } = config;

router
  .get('/_healthz', async (ctx, next) => {
    ctx.body = {};
    next();
  })
  .get('/conf', (ctx, next) => {
    ctx.body = webappConfig;
    next();
  })
  .post('/upload_file', async (ctx) => {
    const { file } = ctx.request.files;
    const result = await uploadFile(file);
    ctx.body = result;
  })
  .get(`${auth1RoutesNamespace}/login`, auth1Middleware.login)
  .get(`${auth1RoutesNamespace}/callback`, auth1Middleware.authorize)
  .get(`${auth1RoutesNamespace}/refresh`, auth1Middleware.refresh)
  .get(`${auth1RoutesNamespace}/logout`, auth1Middleware.logout);

module.exports.routes = function routes() {
  return router.routes();
};
module.exports.allowedMethods = function allowedMethods() {
  return router.allowedMethods();
};
