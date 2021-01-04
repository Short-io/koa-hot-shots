const assert = require('assert');
const StatsD = require('hot-shots');

module.exports = function expressStatsdInit (opt) {
  const options = {
    requestKey: 'statsdKey',
    host: '127.0.0.1',
    port: 8125,
    ...opt
  };

  assert(options.requestKey, 'express-hot-shots expects a requestKey');

  const client = options.client || new StatsD(options.hotShots);

  return async function koaStatsD (ctx, next) {
    const req = ctx.request;
    const res = ctx.response;
    const startTime = new Date().getTime();

    await next();
    let key = req[options.requestKey];
    key = key ? key + '.' : '';

    // Status Code
    const statusCode = res.status || 'unknown_status';
    client.increment(key + 'status_code.' + statusCode, req.statsdTags);

    // Response Time
    const duration = new Date().getTime() - startTime;
    client.timing(key + 'response_time', duration, req.statsdTags);
  };
};
