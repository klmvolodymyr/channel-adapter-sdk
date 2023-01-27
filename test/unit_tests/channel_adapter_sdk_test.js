'use strict';
require('./bootstrap.js');
const sinon = global.sinon;
const _ = require('lodash');
const expect = global.expect;
const ChannelAdapterSDK = require('../../lib/channel_adapter_sdk.js');

describe('Channel Adapter SDK tests ->', function () {

    let channelAdapterSDK;

    beforeEach(async () => {
        channelAdapterSDK = new ChannelAdapterSDK();
    });

    it('onEvent functions expects to invoke a subscribed function with event', async () => {
        let mockFunction = sinon.stub().resolves();
        let mockEventName = 'MOCK_EVENT';
        channelAdapterSDK.subscribe(mockEventName, mockFunction);
        let mockEvent = {
            EVENT_NAME: mockEventName,
        };
        await channelAdapterSDK.onEvent(mockEvent);
        expect(mockFunction.calledOnce).to.be.true;
        expect(mockFunction.calledWith(mockEvent)).to.be.true;
    });

    it('onEvent function expects to throw an Error when invoking a function on a non subscribed event', async () => {
        let mockEventName = 'MOCK_EVENT';
        let mockEvent = {
            EVENT_NAME: mockEventName,
        };
        expect(() => channelAdapterSDK.onEvent(mockEvent)).to.throw('No function subscribed to MOCK_EVENT');
    });

    it('A function subscribed to ANY expects to be invoked on multiple Events', async () => {
        let mockFunction = sinon.stub().resolves();
        let firstEvent = {
            EVENT_NAME: 'FIRST_EVENT',
        };
        let secondEvent = {
            EVENT_NAME: 'SECOND_EVENT',
        };
        channelAdapterSDK.subscribe('ANY', mockFunction);
        await channelAdapterSDK.onEvent(firstEvent);
        expect(mockFunction.calledOnce).to.be.true;
        await channelAdapterSDK.onEvent(secondEvent);
        expect(mockFunction.calledTwice).to.be.true;
    });
});