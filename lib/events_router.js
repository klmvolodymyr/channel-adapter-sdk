'use strict';
const log = global.appLogger;
const router = require('koa-router')({
    prefix: '/v1/event/'
});

class EventsRouter {

    constructor(eventsService) {
        this._eventsService = eventsService;
    }

    routers() {
        router.post('/', this._eventsService.onPost.bind(this._eventsService));
        return router.routes();
    }
}

module.exports = EventsRouter;