'use strict';

const log = global.appLogger;
const router = require('koa-router')({
    prefix: '/health/'
});
const HttpStatus = require('http-status-codes');
class HealthRouter {
    constructor(onEventFunction) {
        this._onEventFunction = onEventFunction;
    }
    routers() {
        router.get('/', async (ctx) => {
            let healthEvent = { EVENT_NAME: 'HEALTH_CHECK' };

            try {
                let isHealthy = await this._onEventFunction(healthEvent);

                if (isHealthy) {
                    ctx.status = HttpStatus.OK;
                    return;
                }
                ctx.status = HttpStatus.INTERNAL_SERVER_ERROR;
            } catch (e) {
                ctx.status = HttpStatus.INTERNAL_SERVER_ERROR;
                ctx.body = {
                    name: e.name,
                    stack: e.stack
                };
            }
        });
        return router.routes();
    }
}

module.exports = HealthRouter;