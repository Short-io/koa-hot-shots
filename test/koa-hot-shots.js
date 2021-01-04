var expect = require('chai').expect;
var koaStatsd = require('../lib/koa-hot-shots');
var utils = require('./utils');

describe('An koa server', function () {
  utils.runStatsd();

  describe('with koa-hot-shots', function () {
    describe('receiving a request', function () {
      utils.runServer(1337, [
        koaStatsd(),
        async function (ctx) {
          ctx.response.body = '';
        }
      ]);
      utils.saveRequest('http://localhost:1337');
      utils.getStatsdMessages();

      it('should make a successful request', function () {
        expect(this.err).to.eql(null);
        expect(this.res.status).to.eql(200);
      });

      it('should send two stats', function () {
        expect(this.messages).to.have.length(2);
      });

      it('should send status_code stat', function () {
        expect(this.messages[0]).to.match(/status_code\.200:\d\|c/);
      });

      it('should send response_time stat', function () {
        expect(this.messages[1]).to.match(/response_time:\d+\|ms/);
      });

      it('should send stats with no key', function () {
        expect(this.messages[0]).to.match(/^status_code\.200:\d\|c$/);
        expect(this.messages[1]).to.match(/^response_time:\d|ms$/);
      });
    });

    describe('receiving a request to a 500ing endpoint', function () {
      utils.runServer(1337, [
        koaStatsd(),
        function (ctx) {
          ctx.response.status = 500;
          ctx.response.body = '';
        }
      ]);
      utils.saveRequest('http://localhost:1337');
      utils.getStatsdMessages();

      it('should send two stats', function () {
        expect(this.messages).to.have.length(2);
      });

      it('should send 500 status_code stat', function () {
        expect(this.messages[0]).to.contain('status_code.500');
      });
    });

    describe('with an altered statsdKey receiving a request', function () {
      utils.runServer(1337, [
        async function (ctx, next) {
          ctx.request.statsdKey = 'my-key';
          await next();
        },
        koaStatsd(),
        async function (ctx) {
          ctx.response.body = '';
        }
      ]);
      utils.saveRequest('http://localhost:1337');
      utils.getStatsdMessages();

      it('should send stats with altered key', function () {
        expect(this.messages[0]).to.match(/^my-key\.status_code\.200:\d\|c$/);
        expect(this.messages[1]).to.match(/^my-key\.response_time:\d|ms$/);
      });
    });

    describe('with a requestKey option receiving a request', function () {
      utils.runServer(1337, [
        function (ctx, next) {
          ctx.request.myKey = 'my-key';
          next();
        },
        koaStatsd({ requestKey: 'myKey' }),
        function (ctx) {
          ctx.response.body = '';
        }
      ]);
      utils.saveRequest('http://localhost:1337');
      utils.getStatsdMessages();

      it('should read from that key', function () {
        expect(this.messages[0]).to.match(/^my-key\.status_code\.200:\d\|c$/);
        expect(this.messages[1]).to.match(/^my-key\.response_time:\d|ms$/);
      });
    });
  });

  describe('without koa-hot-shots receiving a request', function () {
    utils.runServer(1337, [
      function (ctx) {
          ctx.body = '';
      }
    ]);
    utils.saveRequest('http://localhost:1337');
    utils.getStatsdMessages();

    it('should not send stats', function () {
      expect(this.messages).to.have.length(0);
    });
  });
});
