require('../../config.js');

var chai = require('chai');
global.expect = chai.expect;
global.assert = chai.assert;
global.sinon = require('sinon');
chai.use(require('sinon-chai'));
chai.use(require('chai-as-promised'));
const SnsRouter = require('../../node_modules/@vklymniuk/channel-adapter/lib/sns_router.js');

class SnsRouterForTests extends SnsRouter {
    async _validateSnsMessage(ctx, next) {
        await next();
    }
}

const ChannelAdapterSDK = require('../../lib/channel_adapter_sdk')
const ChannelAdapterRunner = require('@vklymniuk/channel-adapter/lib/channel_adapter_runner');

before(async () => {
    global.channelAdapterSDK = new ChannelAdapterSDK();
    await channelAdapterSDK.start();
    global.channelAdapterRunner = new ChannelAdapterRunner(SnsRouterForTests);
    await channelAdapterRunner.start();
});

after(async () => {
        if (global.channelAdapterRunner) {
            await global.channelAdapterRunner.stop();
        }
        if (global.channelAdapterSDK) {
            await global.channelAdapterSDK.stop();
        }
    }
);