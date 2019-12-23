# PaySuper Dashboard

[![License: GPL v3](https://img.shields.io/badge/License-GPLv3-brightgreen.svg)](https://www.gnu.org/licenses/gpl-3.0)
[![contributions welcome](https://img.shields.io/badge/contributions-welcome-brightgreen.svg?style=flat)](https://github.com/paysuper/paysuper-dashboard/issues) 
[![Build Status](https://travis-ci.org/paysuper/paysuper-dashboard.svg?branch=master)](https://travis-ci.org/paysuper/paysuper-dashboard)

The PaySuper Dashboard is  designed as a management tool for a merchant. In this repo you may find the BFF server and VUE based frontend to interact with REST API ([Management API](https://github.com/paysuper/paysuper-management-api)) as administrative dashboard. Settings, management of [Projects and Products](https://docs.pay.super.com/docs/payments/quick-start), reporting is localed in PaySuper Dashboard.

|   | PaySuper Service Architecture
:---: | :---
✨ | **Checkout integration.** [PaySuper JS SDK](https://github.com/paysuper/paysuper-js-sdk) is designed to integrate a Checkout Form on a merchant's website or a game client.
💵 | **Frontend for a payment form.** [PaySuper Checkout Form](https://github.com/paysuper/paysuper-payment-form) is a frontend for a sigle-page application with a payment form.
📊 | **Frontend for a merchant.** [PaySuper Dashboard](https://github.com/paysuper/paysuper-dashboard) is the BFF server and frontend to interact with all PaySuper related features for merchants.
🔧 | **API Backend.** [PaySuper Management API](https://github.com/paysuper/paysuper-management-api) is a REST API backend for the [PaySuper Dashboard](https://github.com/paysuper/paysuper-management-server) and the [PaySuper Checkout Form](https://github.com/paysuper/paysuper-payment-form). Public API methods are documented in the [API Reference](https://docs.pay.super.com/api).
💳 | **Payment processing.** [Billing Server](https://github.com/paysuper/paysuper-billing-server) is a micro-service that provides with any payment processing business logic.

***

## Features

* A nice looking dashboard with graph and key metrics.
* Detailed statistics for each transaction.
* Transparent payout calculation using Royalty reports.
* Reports by a period like **Revenue Reports**: Revenue dynamic, Top countries, Best referrers, Top products, **Dashboard**: Last and next payout, Gross revenue, Total transactions, ARPU, VAT and more to come.
* Export all reports to PDF, XLSX or CSV format for a period.

## Table of Contents

- [Developing](#developing)
    - [Branches](#branches)
    - [PaySuper web interface](#paysuper-web-interface)
    - [Authentication backend for PaySuper](#authentication-backend-for-paysuper)
    - [User Authentication](#user-authentication)
- [Contributing](#contributing-support-feature-requests)
- [License](#license)

## Developing

### Branches

We use the [GitFlow](https://nvie.com/posts/a-successful-git-branching-model) as a branching model for Git.

### PaySuper web interface

### Development

1. To use image uploading create a `.env.local` file with following variables.

```
S3_ACCESS_KEY_ID
S3_SECRET_ACCESS_KEY
S3_BUCKET_NAME
S3_REGION
```

2. Install dependecines:

```bash
yarn
```

2. Run these in different terminal windows:

```bash
yarn serve
```

```bash
yarn serve:be
```

### Authentication backend for PaySuper

#### Dependencies:

* [Node.js](https://nodejs.org/en/download/) v10+
* [NPM](https://www.npmjs.com/get-npm) v6+
* [Redis](https://redis.io/topics/quickstart) v5+

#### Install and run

```
npm install
```

```
npm prune --production
```

```NODE_ENV={string=production} AUTH1_CLIENT_ID={string} AUTH1_CLIENT_SCOPE={string="openid,offline"} 
AUTH1_CLIENT_SECRET={string} AUTH1_ISSUER_URL={string} CORS_VALID_ORIGINS={string} POST_MESSAGE_TARGET_ORIGIN={string} 
PUBLIC_HOST={string} REDIS_HOST={string} REDIS_PORT={string} ROUTES_PREFIX={string} SENTRY_DSN={string} SERVER_PORT=80 
SESSION_COOKIE_NAME={string} SESSION_COOKIE_SIGN_KEY={string} SESSION_MAX_AGE={string=21600} node ./index.js
```

**Obligatory params:**

{AUTH1_CLIENT_ID} - client id for OAuth2 authentication through Auth1 service

{AUTH1_CLIENT_SCOPE} - required client scope for OAuth2 authentication through Auth1 service

{AUTH1_CLIENT_SECRET} - client secret for OAuth2 authentication through Auth1 service

{AUTH1_ISSUER_URL} - url of Auth1 host 

{CORS_VALID_ORIGINS} - list of valid origins for CORS protection, separated by comma. Notice! Value of * uses by default (disable CORS protection)

{NODE_ENV} - Current environment

{POST_MESSAGE_TARGET_ORIGIN} - target origin for postMessages with results of authorization

{PUBLIC_HOST} - Public host url, for example https://landings.protocol.one

{REDIS_HOST} - Redis host

{REDIS_PORT} - Redis post

{ROUTES_PREFIX} - Common prefix for all routes, use empty string by default

{SENTRY_DSN} - public DSN for Sentry

{SERVER_PORT} - Port of koa http server

{SESSION_COOKIE_NAME} - Name of cookie session

{SESSION_COOKIE_SIGN_KEY} - Key for signing cookie session

{SESSION_MAX_AGE} - session lifetime in seconds

### User Authentication

For make a user login, you must create subscribtion for receiving postMessages in your SPA, and then and open an `/login` url in iframe.
All process of authentication will go in that frame, and finally you will be redirected to `/callback` url.

As the result of authentication process you will receive a postMessage from iframe.  
Result will be a json-serialized object with auth token, expire time and error code if it occures.
Actual structure of object you may see in `backend/templates/auth1.postmessage.html.template` file.
Also, targetOrigin of postMessage may be configured in `postMessageTargetOrigin` endpoints option.

Token, that you receive form postMessage, you must store in browser's local storage and  pass as bearer authorization header to all requests to your auth-protected API endpoints.

For refresh you must send ajax request to `GET /refresh`, and you will get json response with updated token.

For logout you must send ajax request to `GET /logout`, this will revoke access and refresh tokens and destroy session.
Logout endpoint send `204 No content` status in case of success, and `500 Internal server error` on other cases (if user already logged out, for example, or not logged yet). In most cases you can ignore this error in your SPA

You do not need pass bearer authorization header to refresh and logout endpoints, because they are authorize your request by user session cookie. Be sure, that you enable send cookies with this requests in your's framework http client!

Also, good idea will be close refresh and logout endpoints with CORS Policy.

## Contributing, Support, Feature Requests
If you like this project then you can put a ⭐️ on it. It means a lot to us.

If you have an idea of how to improve PaySuper (or any of the product parts) or have general feedback, you're welcome to submit a [feature request](../../issues/new?assignees=&labels=&template=feature_request.md&title=).

Chances are, you like what we have already but you may require a custom integration, a special license or something else big and specific to your needs. We're generally open to such conversations.

If you have a question and can't find the answer yourself, you can [raise an issue](../../issues/new?assignees=&labels=&template=support-request.md&title=I+have+a+question+about+%3Cthis+and+that%3E+%5BSupport%5D) and describe what exactly you're trying to do. We'll do our best to reply in a meaningful time.

We feel that a welcoming community is important and we ask that you follow PaySuper's [Open Source Code of Conduct](https://github.com/paysuper/code-of-conduct/blob/master/README.md) in all interactions with the community.

PaySuper welcomes contributions from anyone and everyone. Please refer to [our contribution guide to learn more](CONTRIBUTING.md).

## License

The project is available as open source under the terms of the [GPL v3 License](https://www.gnu.org/licenses/gpl-3.0).
