# koa-hot-shots

[StatsD](https://github.com/etsy/statsd/) route monitoring middleware for 
[koa](https://github.com/koajs/koa)
This middleware can be used either globally or on a per-route basis (preferred)
and sends status codes and response times to StatsD.

Forked from [withspectrum/koa-hot-shots](https://github.com/withspectrum/koa-hot-shots) for usage in [Short.io](https://github.com/short.io)

## Installation

``` bash
npm install @short.io/hot-shots
```

## Usage

An example of an koa server with koa-hot-shots:

``` js
const koa = require('koa');
const route = require('koa-route');
const statsd = require('koa-hot-shots');
const app = new Koa();

app.use(statsd());

app.use(route.get('/', function (ctx) {
  ctx.body = 'Hello World!';
});

app.listen(3000);
```

By default, the middleware will send `status_code` and `response_time` stats
for all requests. For example, using the created server above and a request to
`http://localhost:3000/`, the following stats will be sent:

```
status_code.200:1|c
response_time:100|ms
```

### Per route example

However, it's **highly recommended** that you set `req.statsdKey` which
will be used to namespace the stats. Be aware that stats will only be logged
once a response has been sent; this means that `req.statsdKey` can be
set even after the koa-hot-shots middleware was added to the chain. Here's an 
example of a server set up with a more specific key:

``` js
var koa = require('koa');
var koaStatsd = require('koa-hot-shots');
var app = koa();

function statsd (path) {
  return async (ctx, next) => {
    const method = req.method || 'unknown_method';
    ctx.request.statsdKey = ['http', method.toLowerCase(), path].join('.');
    await next();
  };
}

app.use(koaStatsd());

app.get('/', statsd('home'), function (ctx) {
  ctx.body = 'Hello World!';
});

app.listen(3000);
```

A GET request to `/` on this server would produce the following stats:

```
http.get.home.status_code.200:1|c
http.get.home.response_time:100|ms
```

### Tags

You can set the tags of the metrics with the `req.statsdTags` property.

```JS

function statsd (path) {
  return async (ctx, next) => {
    const method = ctx.request.method || 'unknown_method';
    req.statsdKey = ['http', method.toLowerCase(), path].join('.');
    req.statsdTags = {
      server: process.env.SERVER_NAME,
    }
    await next();
  };
}
```

These will be sent with both the response time and status code metrics.

## Options

``` js
koaStatsd(options);
```

- **options** `Object` - Container for settings
  - **client** `HotShots instance` - a custom hot shots instance
  - **hotShots** `Object` - The hotShots options if you don't want to provide your own instance
  - **requestKey** `String` - The key on the `req` object at which to grab
the key for the statsd logs. Defaults to `req.statsdKey`.
