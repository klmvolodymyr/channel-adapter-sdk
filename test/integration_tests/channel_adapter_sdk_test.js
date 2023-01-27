'use strict';
require('./bootstrap');
const sinon = global.sinon;
const _ = require('lodash');
const expect = global.expect;
const EventHandler = require('@vklymniuk/event-handler').EventHandler;
const Bluebird = require('bluebird');
const request = require('request-promise');
const co = require('co');
const log = global.appLogger;
const uuidv4 = require('uuid/v4');

describe('Channel Adapter SDK integrations tests with EventHandler ->', function () {
    this.timeout(5000);
    let sandbox = sinon.createSandbox();
    let GROUP_ID;
    beforeEach(() => {
        GROUP_ID = uuidv4();
    });
    afterEach(() => {
        sandbox.restore();
        sandbox.reset();
    });

    it('Expect EventHandler to call subscribe functions of ChannelAdapterSDK as it implements iPubSub', () => {
        let channelAdapterSDK = global.channelAdapterSDK;
        let eventHandler = new EventHandler(channelAdapterSDK);
        sandbox.stub(channelAdapterSDK, 'publish');
        eventHandler._contextFactory.create('MOCK_EVENT', {}, {GROUP_ID: GROUP_ID});
        expect(channelAdapterSDK.publish.calledOnce).to.be.true;
        expect(channelAdapterSDK.publish.calledWith('MOCK_EVENT'));
    });

    it('Expect EventHandler to call publish functions of ChannelAdapterSDK as it implements iPubSub', () => {
        let channelAdapterSDK = global.channelAdapterSDK;
        let eventHandler = new EventHandler(channelAdapterSDK);
        sandbox.stub(channelAdapterSDK, 'subscribe');
        eventHandler.registerEventHandler('MOCK_EVENT', async () => {
            return Bluebird.delay(1);
        });
        expect(channelAdapterSDK.subscribe.calledOnce).to.be.true;
        expect(channelAdapterSDK.subscribe.calledWith('MOCK_EVENT'));
    });

    it('EventHandler registered function is expected to be called with Context that has an Event received from SNS', async () => {
        let channelAdapterSDK = global.channelAdapterSDK;
        let eventHandler = new BL1(channelAdapterSDK);
        let snsNotification = require('../sns_notification_request_body');
        let mockEvent = { EVENT_NAME: 'STARTED', };
        snsNotification.Message = JSON.stringify(mockEvent);
        let options = {
            method: 'POST',
            uri: `http://localhost:56432/v1/sns/`,
            body: JSON.stringify(snsNotification),
            simple: true,
            headers: {
                'content-type': 'text/plain; charset=UTF-8',
            },
        };
        await request(options);
        expect(eventHandler.called).to.be.true;
    });

    class BL1 extends EventHandler {

        _initEventHandlers() {
            this.registerEventHandler('STARTED', this.handleStarted.bind(this));
        }

        async handleStarted(ctx) {
            this.called = true;
            return Bluebird.delay(1);
        }
    }
});

describe('Health Check tests -> ', function () {
    this.timeout(5000);
    let sandbox = sinon.createSandbox();
    afterEach(() => {
        sandbox.restore();
        sandbox.reset();
    });

    it('A call to SDKs /health expects to call a registered function to HEALTH_CHECK', async () => {
        let channelAdapterSDK = global.channelAdapterSDK;
        let eventHandler = new EventHandler(channelAdapterSDK);
        let goodHealth = sandbox.stub().resolves(true);
        eventHandler.registerEventHandler('HEALTH_CHECK', goodHealth)
        let options = {
            method: 'GET',
            uri: `http://localhost:32001/health/`,
            simple: false,
            resolveWithFullResponse: true,
            headers: {
                'content-type': 'text/plain; charset=UTF-8',
            }
        };
        let response = await request(options);
        expect(response.statusCode).to.be.eq(200);
        expect(goodHealth.calledOnce).to.be.true;
    });

    it('A call to SDKs /health expects to return 500 when _healthCheck throws error ', async () => {
        let channelAdapterSDK = global.channelAdapterSDK;
        global.channelAdapterRunner._channelAdapter.publishEventToSns = sandbox.stub();
        let eventHandler = new EventHandler(channelAdapterSDK);
        let badHealth = function () {
            return new Promise((resolve, reject) => {
                reject('error');
            });
        }
        eventHandler.registerEventHandler('HEALTH_CHECK', badHealth)
        let options = {
            method: 'GET',
            uri: `http://localhost:32001/health/`,
            simple: false,
            resolveWithFullResponse: true,
            headers: {
                'content-type': 'text/plain; charset=UTF-8',
            }
        };
        let response = await request(options);
        expect(response.statusCode).to.be.eq(500);
    });

    it('A call to SDKs /health expects to return 500 when _healthCheck returns false ', async () => {
        let channelAdapterSDK = global.channelAdapterSDK;
        let eventHandler = new EventHandler(channelAdapterSDK);
        let badHealth = sandbox.stub().resolves(false);
        eventHandler.registerEventHandler('HEALTH_CHECK', badHealth)
        let options = {
            method: 'GET',
            uri: `http://localhost:32001/health/`,
            simple: false,
            resolveWithFullResponse: true,
            headers: {
                'content-type': 'text/plain; charset=UTF-8',
            },
        };
        let response = await request(options);
        expect(response.statusCode).to.be.eq(500);
    });

    it('A call to CAs /health expects to return 200 when Event Handler health check passes', async () => {
        let channelAdapterSDK = global.channelAdapterSDK;
        let eventHandler = new EventHandler(channelAdapterSDK);
        let goodHealth = sandbox.stub().resolves(true);
        eventHandler.registerEventHandler('HEALTH_CHECK', goodHealth)
        let options = {
            method: 'GET',
            uri: `http://localhost:56432/health/`,
            simple: false,
            resolveWithFullResponse: true,
            headers: {
                'content-type': 'text/plain; charset=UTF-8',
            },
        };
        let response = await request(options);
        expect(response.statusCode).to.be.eq(200);
        expect(goodHealth.calledOnce).to.be.true;
    });

    it('A call to CAs /health expects to return 500 when Event Handler health check throws', async () => {
        let channelAdapterSDK = global.channelAdapterSDK;
        global.channelAdapterRunner._channelAdapter.publishEventToSns = sandbox.stub();
        let eventHandler = new EventHandler(channelAdapterSDK);
        let badHealth = function () {
            return new Promise((resolve, reject) => {
                reject('error');
            });
        }
        eventHandler.registerEventHandler('HEALTH_CHECK', badHealth)
        let options = {
            method: 'GET',
            uri: `http://localhost:56432/health/`,
            simple: false,
            resolveWithFullResponse: true,
            headers: {
                'content-type': 'text/plain; charset=UTF-8'
            }
        };
        let response = await request(options);
        expect(response.statusCode).to.be.eq(500);
    });

    it('A call to CAs /health expects to return 500 when Event Handler health check returns false', async () => {
        let channelAdapterSDK = global.channelAdapterSDK;
        let eventHandler = new EventHandler(channelAdapterSDK);
        let badHealth = sandbox.stub().resolves(false);
        eventHandler.registerEventHandler('HEALTH_CHECK', badHealth)
        let options = {
            method: 'GET',
            uri: `http://localhost:56432/health/`,
            simple: false,
            resolveWithFullResponse: true,
            headers: {
                'content-type': 'text/plain; charset=UTF-8'
            }
        };
        let response = await request(options);
        expect(response.statusCode).to.be.eq(500);
    });

    it('HEALTH_CHECK event should not invoke a function registered to ANY', async () => {
        let mockFunction = sinon.stub().resolves();
        let channelAdapterSDK = global.channelAdapterSDK;
        let eventHandler = new EventHandler(channelAdapterSDK);
        eventHandler.registerEventHandler('ANY', mockFunction);
        let goodHealth = sandbox.stub().resolves(true);
        eventHandler.registerEventHandler('HEALTH_CHECK', goodHealth);
        let options = {
            method: 'GET',
            uri: `http://localhost:56432/health/`,
            simple: false,
            resolveWithFullResponse: true,
            headers: {
                'content-type': 'text/plain; charset=UTF-8'
            }
        };
        let response = await request(options);
        expect(response.statusCode).to.be.eq(200);
        expect(mockFunction.called).to.be.false;
        delete channelAdapterSDK._eventHandlers['ANY'];

    });
});

// Patch: This describe should be performed last, as two of its tests are breaking other tests
// Couldn't figure out a way to completely remove the stubs out of a globally shared channel adapter
describe('Channel Adapter SDK with Channel Adapter integration tests ->', function () {
    this.timeout(5000);
    let sandbox = sinon.createSandbox();

    afterEach(() => {
        sandbox.restore();
        sandbox.reset();
    });

    it('An incoming SNS notification expects to invoke _executeEventHandler function via Channel Adapter', async () => {
        let channelAdapterSDK = global.channelAdapterSDK;
        sandbox.stub(channelAdapterSDK, '_executeEventHandler');
        let snsNotification = require('../sns_notification_request_body');
        let mockEvent = {
            EVENT_NAME: 'HELLO_WORLD'
        }
        snsNotification.Message = JSON.stringify(mockEvent);
        let options = {
            method: 'POST',
            uri: `http://localhost:56432/v1/sns/`,
            body: JSON.stringify(snsNotification),
            simple: true,
            headers: {
                'content-type': 'text/plain; charset=UTF-8'
            }
        };
        await request(options);
        expect(channelAdapterSDK._executeEventHandler.calledOnce).to.be.true;
        expect(channelAdapterSDK._executeEventHandler.calledWith(mockEvent)).to.be.true;
    });

    it('A POSTed EVENT expects to invoke _executeEventHandler function', async () => {
        let channelAdapterSDK = global.channelAdapterSDK;
        let mockEvent = {
            EVENT_NAME: 'MOCK_EVENT'
        };
        sandbox.stub(channelAdapterSDK, '_executeEventHandler');
        let options = {
            method: 'POST',
            uri: `http://localhost:32001/v1/event/`,
            body: mockEvent,
            json: true,
            simple: true
        };
        await request(options);
        expect(channelAdapterSDK._executeEventHandler.calledOnce).to.be.true;
    });

    // This one is overriding the global channel adapter's publishEventToSns function
    // which causes other tests to break
    it('SDK publish function invokes Channel Adapter publishToSns function', async () => {
        global.channelAdapterRunner._channelAdapter.publishEventToSns = sandbox.stub();
        let mockEvent = {
            EVENT_NAME: 'MOCK_EVENT'
        };
        await global.channelAdapterSDK._publishToChannelAdapter(mockEvent);
        expect(global.channelAdapterRunner._channelAdapter.publishEventToSns.calledOnce).to.be.true;
        expect(global.channelAdapterRunner._channelAdapter.publishEventToSns.calledWith(mockEvent)).to.be.true;
    });

    // This one is overriding the global channel adapter's publishEventToSns function
    // which causes other tests to break
    it('Failed subscribed function to SDK expects to return 500 to SNS', async () => {
        global.channelAdapterRunner._channelAdapter.publishEventToSns = sandbox.stub();
        let channelAdapterSDK = global.channelAdapterSDK;
        let errorFunction = sandbox.stub().throws('BAD FUNCTION');
        let snsNotification = require('../sns_notification_request_body');
        let mockEvent = {
            EVENT_NAME: 'BAD_WORLD'
        }
        await channelAdapterSDK.subscribe(mockEvent.EVENT_NAME, errorFunction);
        snsNotification.Message = JSON.stringify(mockEvent);
        let options = {
            method: 'POST',
            uri: `http://localhost:56432/v1/sns/`,
            body: JSON.stringify(snsNotification),
            simple: false,
            resolveWithFullResponse: true,
            headers: {
                'content-type': 'text/plain; charset=UTF-8'
            }
        };
        let response = await request(options);
        expect(response.statusCode).to.be.eq(500);
        let parsedBody = JSON.parse(response.body);
        expect(parsedBody.stack).to.have.string('BAD FUNCTION');
        expect(parsedBody.stack).to.have.string('channel_adapter_sdk.js');
    });

    it('Executed function is expected to be complete before returning 200 to SNS', async () => {
        let workDelay = 2000;
        let channelAdapterSDK = global.channelAdapterSDK;
        let called = false;
        let workFunction = sandbox.stub().callsFake(async () => {
            return new Promise(async (resolve, reject) => {
                // doing some work
                await Bluebird.delay(workDelay);
                called = true;
                resolve();
            });

        });
        let snsNotification = require('../sns_notification_request_body');
        let mockEvent = {
            EVENT_NAME: 'WORK_WORLD'
        }
        snsNotification.Message = JSON.stringify(mockEvent);
        await channelAdapterSDK.subscribe(mockEvent.EVENT_NAME, workFunction);
        let options = {
            method: 'POST',
            uri: `http://localhost:56432/v1/sns/`,
            body: JSON.stringify(snsNotification),
            simple: false,
            resolveWithFullResponse: true,
            headers: {
                'content-type': 'text/plain; charset=UTF-8'
            }
        };
        let response;
        co(async () => {
            response = await request(options);
        });
        await Bluebird.delay(workDelay / 2);
        expect(called).to.be.false;
        await Bluebird.delay(workDelay / 2 + 100);
        expect(response.statusCode).to.be.eq(200);
        expect(called).to.be.true;
    });

});