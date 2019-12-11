const fs = require('fs');
const path = require('path');
const qs = require('qs');
const _ = require('lodash');
const Handlebars = require('handlebars');
const config = require('../../config/config');

const orderTemplate = fs.readFileSync(path.resolve('backend/templates/order-page.hbs'), 'utf-8');
const renderOrder = Handlebars.compile(orderTemplate);

const resultTemplate = fs.readFileSync(path.resolve('backend/templates/result-page.hbs'), 'utf-8');
const renderResult = Handlebars.compile(resultTemplate);

const isDev = process.env.NODE_ENV === 'local';

module.exports = async function orderPage(ctx) {
  const [, queryString] = ctx.request.url.split('?');
  const query = qs.parse(queryString);

  const [host] = ctx.request.host.split(':');
  const formUrl = isDev ? `http://${host}:4040/paysuper-form.js` : config.paysuperFormUrl;

  if (_.includes(['success', 'fail'], query.result)) {
    return renderResult({
      data: JSON.stringify({
        result: query.result,
      }),
    });
  }

  return renderOrder({
    formUrl: formUrl.replace('%v', 'latest'),
  });
};
