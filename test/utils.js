const assert = require('assert');
const dgram = require('dgram');
const Koa = require('koa');
const fetch = require('node-fetch');

exports.runStatsd = function startStatsd () {
  before(function () {
    this.statsd = dgram.createSocket('udp4');
    this.statsd.bind(8125, '127.0.0.1');
  });
  after(function (done) {
    this.statsd.on('close', done);
    this.statsd.close();
  });
};

exports.getStatsdMessages = function getStatsdMessages () {
  before(function retrievingStatsdMessages (done) {
    var messages = this.messages = [];
    this.statsd.on('message', function (message) {
      messages.push(message.toString());
    });
    setTimeout(done, 100);
  });
};

exports.runServer = function (port, middlewares) {
  before(function () {
    assert(port, 'runServer expects a port');
    middlewares = middlewares || [];

    const app = new Koa();
    middlewares.forEach(function (middleware) {
      app.use(middleware);
    });
    this.server = app.listen(port);
  });
  after(function (done) {
    this.server.close(done);
  });
};

exports.saveRequest = function makeRequest (url, options) {
  before(async function () {
    try {
        const res = await fetch(url, options);
        const body = await res.text();
        this.res = res;
        this.body = body;
        this.err = null;
    } catch (e) {
        this.err = e;
    }
  });
};
