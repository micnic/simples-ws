'use strict';

const tap = require('tap');
const { URL } = require('url');

const ws = require('simples-ws').default;

global.window = {
	location: {
		host: 'localhost',
		href: 'http://localhost/path',
		pathname: '/path',
		protocol: 'http:'
	}
};

global.WebSocket = class {

	constructor() {
		Promise.resolve().then(() => {
			if (typeof this.onopen === 'function') {
				this.onopen();
			}
		});
	}

	close() {
		Promise.resolve().then(() => {
			if (typeof this.onclose === 'function') {
				this.onclose();
			}
		});
	}

	send(data) {
		Promise.resolve().then(() => {
			if (typeof this.onmessage === 'function') {
				this.onmessage({
					data
				});
			}
		});
	}
};

global.URL = URL;

tap.test('ws()', (test) => {

	test.test('No arguments, http protocol', (t) => {

		const socket = ws();

		t.ok(socket.data && typeof socket.data === 'object');
		t.equal(socket._advanced, false);
		t.ok(socket._events instanceof Map);
		t.equal(socket._url, 'ws://localhost/path');
		t.equal(socket._opening, true);
		t.ok(Array.isArray(socket._protocols));
		t.ok(socket._socket instanceof global.WebSocket);
		t.equal(socket._started, false);

		t.end();
	});

	test.test('No arguments, https protocol', (t) => {

		global.window.location.protocol = 'https:';

		const socket = ws();

		global.window.location.protocol = 'http:';

		t.ok(socket.data && typeof socket.data === 'object');
		t.equal(socket._advanced, false);
		t.ok(socket._events instanceof Map);
		t.equal(socket._url, 'wss://localhost/path');
		t.equal(socket._opening, true);
		t.ok(Array.isArray(socket._protocols));
		t.ok(socket._socket instanceof global.WebSocket);
		t.equal(socket._started, false);

		t.end();
	});

	test.test('Options provided as the first argument', (t) => {

		const socket = ws({ advanced: true });

		t.ok(socket.data && typeof socket.data === 'object');
		t.equal(socket._advanced, true);
		t.ok(socket._events instanceof Map);
		t.equal(socket._url, 'ws://localhost/path');
		t.equal(socket._opening, true);
		t.ok(Array.isArray(socket._protocols));
		t.ok(socket._socket instanceof global.WebSocket);
		t.equal(socket._started, false);

		t.end();
	});

	test.test('Root path and no options provided', (t) => {

		const socket = ws('/');

		t.ok(socket.data && typeof socket.data === 'object');
		t.equal(socket._advanced, false);
		t.ok(socket._events instanceof Map);
		t.equal(socket._url, 'ws://localhost/');
		t.equal(socket._opening, true);
		t.ok(Array.isArray(socket._protocols));
		t.ok(socket._socket instanceof global.WebSocket);
		t.equal(socket._started, false);

		t.end();
	});

	test.test('Root path and string protocols provided', (t) => {

		const socket = ws('/', { protocols: 'protocol' });

		t.ok(socket.data && typeof socket.data === 'object');
		t.equal(socket._advanced, false);
		t.ok(socket._events instanceof Map);
		t.equal(socket._url, 'ws://localhost/');
		t.equal(socket._opening, true);
		t.ok(Array.isArray(socket._protocols));
		t.equal(socket._protocols.length, 1);
		t.equal(socket._protocols[0], 'protocol');
		t.ok(socket._socket instanceof global.WebSocket);
		t.equal(socket._started, false);

		t.end();
	});

	test.test('Root path and string protocols provided', (t) => {

		const socket = ws('/', { protocols: [ 'protocol1', 'protocol2' ] });

		t.ok(socket.data && typeof socket.data === 'object');
		t.equal(socket._advanced, false);
		t.ok(socket._events instanceof Map);
		t.equal(socket._url, 'ws://localhost/');
		t.equal(socket._opening, true);
		t.ok(Array.isArray(socket._protocols));
		t.equal(socket._protocols.length, 2);
		t.equal(socket._protocols[0], 'protocol1');
		t.equal(socket._protocols[1], 'protocol2');
		t.ok(socket._socket instanceof global.WebSocket);
		t.equal(socket._started, false);

		t.end();
	});

	test.test('Error received', (t) => {

		const socket = ws();
		const someError = Error('Some Error');

		socket.on('error', (error) => {
			t.equal(error, someError);
			t.equal(socket._started, false);
		});

		socket._socket.onerror(someError);

		t.end();
	});

	test.test('Message received, invalid json content', (t) => {

		const socket = ws({
			advanced: true
		});

		socket.on('error', (error) => {
			t.ok(error instanceof Error);
		});

		socket.on('message', (message) => {
			t.equal(message.data, '');
		});

		socket._socket.onmessage({
			data: ''
		});

		t.end();
	});

	test.end();
});

tap.test('ws().on()', (test) => {

	const socket = ws();
	const listener = () => {};

	test.equal(socket._events.size, 0);

	let result = socket.on('event', listener);

	test.equal(result, socket);
	test.equal(socket._events.size, 1);
	test.ok(Array.isArray(socket._events.get('event')));
	test.equal(socket._events.get('event').length, 1);
	test.equal(socket._events.get('event')[0], listener);

	result = socket.on('event', listener);

	test.equal(result, socket);
	test.equal(socket._events.size, 1);
	test.ok(Array.isArray(socket._events.get('event')));
	test.equal(socket._events.get('event').length, 2);
	test.equal(socket._events.get('event')[0], listener);
	test.equal(socket._events.get('event')[1], listener);

	result = socket.on('event');

	test.equal(result, socket);
	test.equal(socket._events.size, 1);
	test.ok(Array.isArray(socket._events.get('event')));
	test.equal(socket._events.get('event').length, 2);
	test.equal(socket._events.get('event')[0], listener);
	test.equal(socket._events.get('event')[1], listener);

	test.end();
});

tap.test('ws().off()', (test) => {

	const socket = ws();
	const listener = () => {};

	socket.on('event', listener);

	let result = socket.off('event', listener);

	test.equal(result, socket);
	test.equal(socket._events.size, 1);
	test.ok(Array.isArray(socket._events.get('event')));
	test.equal(socket._events.get('event').length, 0);

	result = socket.off('event', listener);

	test.equal(result, socket);
	test.equal(socket._events.size, 1);
	test.ok(Array.isArray(socket._events.get('event')));
	test.equal(socket._events.get('event').length, 0);

	result = socket.off('no-event', listener);

	test.equal(result, socket);
	test.equal(socket._events.size, 1);
	test.ok(Array.isArray(socket._events.get('event')));
	test.equal(socket._events.get('event').length, 0);

	result = socket.off('event');

	test.equal(result, socket);
	test.equal(socket._events.size, 0);

	result = socket.off('no-event');

	test.equal(result, socket);
	test.equal(socket._events.size, 0);

	result = socket.off();

	test.equal(result, socket);
	test.ok(socket._events instanceof Map);

	test.end();
});

tap.test('ws().emit()', (test) => {

	const socket = ws();

	let result = socket.emit('no-event');

	test.equal(result, false);

	socket.on('event', function (...args) {
		test.equal(this, socket);
		test.equal(args.length, 2);
		test.equal(args[0], 'data1');
		test.equal(args[1], 'data2');
	});

	result = socket.emit('event', 'data1', 'data2');

	test.equal(result, true);

	try {
		socket.emit('error');
	} catch (error) {
		test.ok(error instanceof Error);
	}

	const someError = Error('some error');

	try {
		socket.emit('error', someError);
	} catch (error) {
		test.equal(error, someError);
	}

	test.end();
});

tap.test('ws().once()', (test) => {

	const socket = ws();

	let onceCalled = 0;

	socket.once('event', (data) => {
		test.equal(data, 'data');
		onceCalled++;
	});

	socket.emit('event', 'data');
	socket.emit('event', 'data');

	test.equal(onceCalled, 1);

	test.end();
});

tap.test('ws().close()', (test) => {

	const socket = ws();

	socket.on('open', () => {
		test.equal(socket._started, true);

		socket.close();
	});

	socket.on('close', () => {
		test.equal(socket._started, false);

		test.end();
	});
});

tap.test('ws().open()', (test) => {

	test.test('Reopen with other path', (t) => {

		const socket = ws();

		socket.open('other-path');

		t.equal(socket._url, 'ws://localhost/other-path');

		t.end();
	});

	test.test('Reopen with new config', (t) => {

		const socket = ws();

		socket.open({
			advanced: true,
			protocols: 'protocol'
		});

		t.equal(socket._advanced, true);
		t.ok(Array.isArray(socket._protocols));
		t.equal(socket._protocols.length, 1);
		t.equal(socket._protocols[0], 'protocol');

		t.end();
	});

	test.test('Reopen with new config and more protocols', (t) => {

		const socket = ws();

		socket.open({
			advanced: true,
			protocols: ['protocol1', 'protocol2']
		});

		t.equal(socket._advanced, true);
		t.ok(Array.isArray(socket._protocols));
		t.equal(socket._protocols.length, 2);
		t.equal(socket._protocols[0], 'protocol1');
		t.equal(socket._protocols[1], 'protocol2');

		t.end();
	});

	test.end();
});

tap.test('ws().send()', (test) => {

	test.test('String data', (t) => {

		const socket = ws();

		socket.once('message', (message) => {
			t.ok(typeof message.data === 'string');
			t.end();
		});

		const result = socket.send('data');

		t.equal(result, socket);
	});

	test.test('ArrayBuffer data', (t) => {

		const socket = ws();

		socket.once('message', (message) => {
			t.ok(message.data instanceof ArrayBuffer);
			t.end();
		});

		const result = socket.send(new ArrayBuffer(4));

		t.equal(result, socket);
	});

	test.test('ArrayBufferView data', (t) => {

		const socket = ws();

		socket.once('message', (message) => {
			t.ok(ArrayBuffer.isView(message.data));
			t.end();
		});

		const result = socket.send(new Int8Array(4));

		t.equal(result, socket);
	});

	test.test('After close', (t) => {

		const socket = ws();

		socket.once('open', () => {
			socket.close();

			socket.once('message', (message) => {
				t.ok(typeof message.data === 'string');
				t.end();
			});

			const result = socket.send('data');

			t.equal(result, socket);
		});
	});

	test.test('When open', (t) => {

		const socket = ws();

		socket.once('open', () => {

			socket.once('message', (message) => {
				t.ok(typeof message.data === 'string');
				t.end();
			});

			const result = socket.send('data');

			t.equal(result, socket);
		});
	});

	test.test('Send object when open', (t) => {

		const socket = ws();

		socket.once('open', () => {

			socket.once('message', (message) => {
				t.ok(typeof message.data === 'string');
				t.end();
			});

			const result = socket.send({});

			t.equal(result, socket);
		});
	});

	test.test('Send object with circular reference when open', (t) => {

		const socket = ws();

		socket.once('open', () => {

			socket.once('error', (error) => {
				t.ok(error instanceof Error);
			});

			const o = {};

			o.o = o;

			const result = socket.send(o);

			t.equal(result, socket);

			t.end();
		});
	});

	test.test('Send in advanced mode with callback when open', (t) => {

		const socket = ws({
			advanced: true
		});

		socket.once('open', () => {

			const result = socket.send('event', 'data', (response) => {
				t.equal(response, 'data');

				t.end();
			});

			t.equal(result, socket);
		});
	});

	test.end();
});