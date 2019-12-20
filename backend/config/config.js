const path = require('path');

const envUtils = require('../app/utils/env');

const { getEnvVariable } = envUtils;
const { getEnvVariableArray } = envUtils;

const config = {
  serverPort: +getEnvVariable('SERVER_PORT', 8080),

  redisHost: getEnvVariable('REDIS_HOST', ''),
  redisPort: +getEnvVariable('REDIS_PORT', '6379'),

  sessionMaxAge: +getEnvVariable('SESSION_MAX_AGE', '21600'), // 6 hours, in seconds
  sessionCookieName: getEnvVariable('SESSION_COOKIE_NAME', 'pssid'),
  sessionCookieSignKey: getEnvVariable('SESSION_COOKIE_SIGN_KEY', '02e435ef-7015-4c9b-8e4e-00a376f80332'),

  routesPrefix: getEnvVariable('ROUTES_PREFIX', ''),
  auth1RoutesNamespace: '/auth1',

  sentryDsn: getEnvVariable('SENTRY_DSN', 'https://784314fe11d44fb0872d0044a28339a3@sentry.io/1796353'),

  publicHost: getEnvVariable('PUBLIC_HOST', 'http://localhost:8080'),

  postMessageTargetOrigin: getEnvVariable('POST_MESSAGE_TARGET_ORIGIN', 'http://localhost:3030'),

  auth1ClientId: getEnvVariable('AUTH1_CLIENT_ID', '5c77953f51c0950001436152'),
  auth1ClientSecret: getEnvVariable('AUTH1_CLIENT_SECRET', 'tGtL8HcRDY5X7VxEhyIye2EhiN9YyTJ5Ny0AndLNXQFgKCSgUKE0Ti4X9fHK6Qib'),
  auth1Scope: getEnvVariableArray('AUTH1_CLIENT_SCOPE', 'openid,offline'),
  auth1Issuer: getEnvVariable('AUTH1_ISSUER_URL', 'https://auth1.tst.protocol.one'),
  auth1PostmessageHtmlTemplatePath: path.resolve('backend/templates/auth1.postmessage.html.template'),
  auth1SessionNamespace: 'auth1',

  corsValidOrigins: getEnvVariableArray('CORS_VALID_ORIGINS', 'http://localhost:3030'),

  s3AccessKeyId: getEnvVariable('S3_ACCESS_KEY_ID'),
  s3SecretAccessKey: getEnvVariable('S3_SECRET_ACCESS_KEY'),
  s3BucketName: getEnvVariable('S3_BUCKET_NAME'),
  s3Region: getEnvVariable('S3_REGION'),
};

module.exports = config;
