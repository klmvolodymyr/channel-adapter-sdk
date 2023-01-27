'use strict';

const DEFAULTS = global.DEFAULTS
const request = require('request-promise');

const log = global.appLogger;
const Koa = require('koa');
const BodyParser = require('koa-bodyparser');
const EventsService = require('./events_service');
const EventsRouter = require('./events_router');
const HealthRouter = require('./health_router');
const _ = require('lodash');
const ANY = 'ANY';
const HEALTH_CHECK_EVENT_NAME = 'HEALTH_CHECK';

class ChannelAdapterSDK {

    constructor() {
        this._incomingEventsPort = DEFAULTS.channelAdapter.incomingEventsPort;
        let channelAdapterHost = DEFAULTS.channelAdapter.host;
        let channelAdapterPort = DEFAULTS.channelAdapter.port;
        let channelAdapterPath = DEFAULTS.channelAdapter.pathToPostEvents;
        this._channelAdapterUri = `http://${channelAdapterHost}:${channelAdapterPort}${channelAdapterPath}`;
        this._eventHandlers = {};
        this._sdkServer = {};
    }

    subscribe(eventName, eventHandlingFunc) {
        this._eventHandlers[eventName] = eventHandlingFunc;
    }

    start() {
        return this._startSDKWebServer();
    }

    onEvent(event) {
        return this._executeEventHandler(event);
    }

    _executeEventHandler(event) {
        const anyCb = this._eventHandlers[ANY];
        const cb = this._eventHandlers[event.EVENT_NAME];

        if (!cb && !anyCb) {
            throw new Error(`No function subscribed to ${event.EVENT_NAME}`);
        }

        if (event.EVENT_NAME === HEALTH_CHECK_EVENT_NAME) {
            return cb(event);
        }

        if (anyCb) {
            return anyCb(event);
        }

        return cb(event);
    }

    async _startSDKWebServer() {
        this._sdkServer.app = new Koa();
        this._addRequiredMiddlewares(this._sdkServer.app);
        this._sdkServer.eventsService = new EventsService(this.onEvent.bind(this));
        let eventsRouter = new EventsRouter(this._sdkServer.eventsService);
        this._sdkServer.app.use(eventsRouter.routers());
        let healthRouter = new HealthRouter(this.onEvent.bind(this));
        this._sdkServer.app.use(healthRouter.routers());
        this._sdkServer.server = await this._startWebServerAsync(this._sdkServer.app, this._incomingEventsPort);
        log.info(`Channel Adapter SDK: Web Server for incoming EVENTs from Channel Adapter has Started at port ${this._incomingEventsPort}`);
    }

    _addRequiredMiddlewares(app) {
        app.use(BodyParser({
            enableTypes: ['text', 'json']
        }));
    }

    _startWebServerAsync(app, port) {
        return new Promise((resolve, reject) => {
            let server = app.listen(port, (err) => {

                if (err) {
                    reject(err);
                }
                resolve(server);
            });
        });
    }

    stop() {
        this._sdkServer.server.close();
    }

    publish(eventName, event) {
        return this._publishToChannelAdapter(event);
    }

    _publishToChannelAdapter(event) {
        let options = {
            method: 'POST',
            uri: this._channelAdapterUri,
            body: event,
            json: true,
            simple: true
        };

        return request(options);
    }
}

module.exports = ChannelAdapterSDK;