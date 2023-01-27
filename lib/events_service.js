'use strict';

const log = global.appLogger;
const HttpStatus = require('http-status-codes');
class EventsService {
    constructor(onEventFunction) {
        this._onEventFunction = onEventFunction;
    }
    async onPost(ctx) {
        let requestBody = ctx.request.rawBody;
        requestBody = JSON.parse(requestBody);
        try {
            await this._onEventFunction(requestBody);
            ctx.status = HttpStatus.OK;
        } catch (e) {
            log.error(e);
            ctx.status = HttpStatus.INTERNAL_SERVER_ERROR;
            ctx.body = {
                name: e.name,
                stack: e.stack,
            };
        }
    }
}

module.exports = EventsService;