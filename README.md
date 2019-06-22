[0]: https://www.npmjs.com/package/simples
[1]: https://developer.mozilla.org/en-US/docs/Web/API/WebSocket/WebSocket
[2]: https://developer.mozilla.org/en-US/docs/Web/API/WebSocket/close
[3]: https://developer.mozilla.org/en-US/docs/Web/API/MessageEvent

# simples-ws 0.9.0

`simples-ws` is a simplified WebSocket API client for browsers, it is a thin
abstraction over the native WebSocket API and work with the same concepts, it is
designed to work in pair with [simples][0] server, but can work with any backend
that implements the standard WebSocket protocol.

## Features

- Support for relative connection url, automatic WS protocol selection
- Send delayed messages while connection is still opening
- Auto-reconnection when sending data and the connection is closed
- Possibility to change url and configuration when reopening connection
- Designed to work with simples advanced WebSocket mode
- No dependencies
- ES module and UMD builds available (see `dist/` folder)

## Install

```
npm i simples-ws
```

Or install the package together with [simples][0]:

```
npm i simples simples-ws
```

## Support

`simples-ws` is supported by any browser that has native support for
`WebSocket`, `URL` and `Map`, it will also work in CommonJS and AMD
environments, see `dist/` folder for build files.

Supported browsers:
- Chrome 38+
- Firefox 19+
- Edge any version
- Opera 25+
- Safari 8+

**Note**: Internet Explorer is not supported without polyfills.

## Usage

### ES6+ syntax

```js
import ws from 'simples-ws';
```

### CommonJS Environment

```js
const ws = require('simples-ws').default;
```

### Browser Script

```js
window.ws; // It is available as a global "ws" reference
```

---

### Socket Creation

```js
const socket = ws('ws://example.com/ws');

// Or use relative url

const socket = ws('/ws'); // The url will be filled with the missing parts

// Or use current window location

const socket = ws(); // The url will be created from "window.location.href"
```
The `ws()` function accepts 2 arguments, the first one is the `url` of the
connection, the second one are the `options` of the connection, it will return
an instance of a `WS` connection, which is a light abstraction over the native
`WebSocket` class.

The `url` argument must be a string representing a relative or an absolute url
to the remote server, if omitted the `window.location.href` value is used by
default for connection creation.

The `options` argument must be an object with `advanced` property to enable
`simples` advanced mode behavior and `protocols` property which is the same as
the second argument used in native [WebSocket constructor][1].

Example with full configuration:

```js
const socket = ws('ws://example.com/ws', {
    advanced: true,                         // simples advanced mode enabled
    protocols: [                            // WebSocket subprotocols
        'some-protocol',
        'other-protocol'
    ]
});
```

`WS` instances have a `.data` property which is available to store used defined
data, main purpose is to contain connection meta data.

`WS` connection management is done by the following methods:
- `.open([url, options])` - reopen `WS` connection, optionally url and options
can be modified, this method is automatically called on `WS` connection
creation, no need to call it explicitly. This method returns a reference to
`this` so calls can be chained.
- `.close([code [, reason]])` - close `WS` connection, optionally the code and
the reason of the closing can be provided, same used in native [`.close`][2]
method . This method returns a reference to `this` so calls can be chained.

### Advanced Mode

The advanced mode is a special behavior of the `WS` connections, it involves a
`JSON` data communication via events, messages transferred using this mode have
the following structure:

```json
{
    "event": "event-name",
    "data": { }
}
```

Obviously, only data that can be passed to `JSON.stringify()` can be sent using
this mode. `simples-ws` ensures that the messages transmitted using this mode
will be automatically stringified on sending and parsed on receiving. The same
behavior has to be enabled on the server side to have a proper communication
between the server and the client, as it was designed for [simples][0], see its
documentation on how to enable advanced mode on the server.

### Events Handling

Every `WS` instance implements a simplified Event Emitter API which contains the
following methods:
- `.on(event, listener)` - method to attach event listeners, receives 2
arguments, event name and event listener, returns a reference to `this` so calls
can be chained.
- `.once(event, listener)` - method to attach one-time event listeners, receives
2 arguments, event name and event listener, returns a reference to `this` so
calls can be chained.
- `.off([event [, listener]])` - method to remove event listeners, receives
2 arguments, event name and event listener, both arguments are optional, based
on the provided arguments one event listener, all event listeners with the same
event name or all the event listeners will be removed, returns a reference to
`this` so calls can be chained.
- `.emit(event [, ...data])` - method to call event listeners, receives multiple
arguments, the first one is the event name, the next arguments are event data,
returns a boolean value representing if any event listener was called. **Note**:
this method does not send any data through the `WebSocket` connection, its
purpose is to call event listeners locally.

#### Default Events

There are some default events which are during the life cycle of the `WS`
connection:
- `open` - event called when the `WS` connection is opened or reopened.
- `message` - event called when the `WS` connection receives a message in simple
mode or it was received in advanced mode but the JSON data could not be parsed,
in this case an error should be called before this event. The received message
is a [MessageEvent][3].
- `close` - event called when the `WS` connection is closed.
- `error` - event called when the `WS` connection throws an error, in case it is
triggered by the underlying `WebSocket` connection it will also close the
connection. It is recommended to always have an event listener for error events
to handle any undesired behavior.

### Sending Data

To send data through the `WS` connection `.send()` method is used, in simple and
advanced modes it behaves differently:
- `.send(data)` - in simple mode this method receives only one argument and
behaves almost the same as the method `.send()` of native `WebSocket`, `string`,
`ArrayBuffer` and `ArrayBufferView` values will be sent as they are, any other
value will be passed to `JSON.stringify()`.
- `.send(event, data [, callback])` - in advanced mode this method can receive
two or three arguments, `event` argument must be a string which represents the
event name, `data` argument is any data that can be passed to
`JSON.stringify()`, no binary data will be sent in this mode, `callback`
argument is optional and it is used as a one-time listener for the provided
event to handle the response from the server.

`.send()` method can be used while the connection is still opening, the messages
will be delayed until the connection is ready to accept them. If the connection
is down calling `.send()` method will try to reopen it and send the provided
when it is open. This method will throw errors in case of circular references or
invalid `JSON` values, it returns a reference to `this` so calls can be chained.

Example for sending data in advanced mode:

```js
socket.send('event', 'data', (response) => {
    console.log(response);
});

// This is equivalent to the following expression

socket.send('event', 'data').once('event', (response) => {
    console.log(response);
});
```

### Examples

#### Simple Mode

```js
import ws from 'simples-ws';

const socket = ws('ws://example.com/ws');

socket.on('message', (message) => {
    console.log(message.data);
});

socket.send('data');
```

#### Advanced Mode

```js
import ws from 'simples-ws';

const socket = ws('ws://example.com/ws', {
    advanced: true
});

socket.on('some-event', (data) => {
    console.log(data);
});

socket.send('some-event', 'data');
```