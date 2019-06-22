const closeEvent = 'close'; // Close event string
const errorEvent = 'error'; // Error event string
const httpsProtocol = 'https:'; // HTTPS protocol value in location string
const messageEvent = 'message'; // Message event string
const openEvent = 'open'; // Open event string
const securedProtocolSuffix = 's'; // Suffix for secured protocols
const wsProtocol = 'ws'; // WS protocol name

const unspecifiedError = Error('Uncaught, unspecified "error" event.');
const messageParsingError = Error('Can not parse message');

class WS {

	/**
	 * WS constructor
	 */
	constructor() {

		// Define public WebSocket properties
		this.data = {};

		// Define private WebSocket properties
		this._advanced = false;
		this._events = new Map();
		this._url = WS.normalizeURL(window.location.href);
		this._opening = false;
		this._protocols = [];
		this._socket = null;
		this._started = false;
	}

	/**
	 * Close the WebSocket connection
	 * @param {number} code
	 * @param {string} reason
	 * @returns {this}
	 */
	close(code, reason) {

		// Close the WebSocket only if it is started
		if (this._started) {
			this._started = false;
			this._socket.close(code, reason);
		}

		return this;
	}

	/**
	 * Dispatch an event
	 * @param {string} event
	 * @param {*[]} args
	 * @returns {boolean}
	 */
	emit(event, ...args) {

		// Throw the error if there are no listeners for error event
		if (event === errorEvent && !this._events.has(errorEvent)) {
			if (args[0] instanceof Error) {
				throw args[0];
			} else {
				throw unspecifiedError;
			}
		}

		// Check if the event has listeners
		if (this._events.has(event)) {
			this._events.get(event).forEach((listener) => {
				listener.apply(this, args);
			});

			return true;
		}

		return false;
	}

	/**
	 * Remove one event listener, all listeners of an event, or all of them
	 * @param {string} event
	 * @param {Listener} listener
	 * @returns {this}
	 */
	off(event, listener) {

		// Check for provided arguments to remove the selected listeners
		if (event && listener) {
			if (this._events.has(event)) {

				const index = this._events.get(event).indexOf(listener);

				// Check if listener is found to remove it
				if (index >= 0) {
					this._events.get(event).splice(index, 1);
				}
			}
		} else if (event) {
			if (this._events.has(event)) {
				this._events.delete(event);
			}
		} else {
			this._events = new Map();
		}

		return this;
	}

	/**
	 * Append a listener for an event
	 * @param {string} event
	 * @param {Listener} listener
	 * @returns {this}
	 */
	on(event, listener) {

		// Check if listener is a function
		if (typeof listener === 'function') {

			let listeners = this._events.get(event);

			// Create the event listeners container if it is missing
			if (!listeners) {
				listeners = [];
				this._events.set(event, listeners);
			}

			// Add the listener to the list
			listeners.push(listener);
		}

		return this;
	}

	/**
	 * Append an one time listener for an event
	 * @param {string} event
	 * @param {Listener} listener
	 * @returns {this}
	 */
	once(event, listener) {

		const onceListener = (...args) => {
			listener.apply(this, args);
			this.off(event, onceListener);
		};

		return this.on(event, onceListener);
	}

	/**
	 * Open or reopen the WebSocket connection
	 * @param {string} url
	 * @param {WSOptions} options
	 * @returns {this}
	 */
	open(url, options) {

		let config = options;

		// Make path and options arguments optional
		if (typeof url === 'object') {
			config = url;
		} else if (typeof url === 'string') {
			this._url = WS.normalizeURL(url);
		}

		// Check for provided config
		if (config && typeof config === 'object') {

			// Check for changed advanced mode
			if (config.advanced) {
				this._advanced = (config.advanced === true);
			}

			// Get the WebSocket sub-protocols
			if (Array.isArray(config.protocols)) {
				this._protocols = config.protocols.filter((element) => {
					return (typeof element === 'string');
				});
			} else if (typeof config.protocols === 'string') {
				this._protocols.push(config.protocols);
			}
		}

		// Set the opening flag
		this._opening = true;

		// Close the previously used socket
		this.close();

		// Initialize the WebSocket connection
		this._socket = new WebSocket(this._url, this._protocols);

		// Listen for socket close
		this._socket.onclose = (event) => {
			this._started = false;
			this.emit(closeEvent, event);
		};

		// Catch socket errors
		this._socket.onerror = (error) => {
			this._started = false;
			this.emit(errorEvent, error);
		};

		// Listen for incoming messages
		this._socket.onmessage = (event) => {

			// Parse and emit the received data
			if (this._advanced) {

				let message = event;

				// Try to parse JSON data from the message
				try {
					message = JSON.parse(message.data);
				} catch (error) {
					this.emit(errorEvent, messageParsingError);
				} finally {
					if (message === event) {
						this.emit(messageEvent, event);
					} else {
						this.emit(message.event, message.data);
					}
				}
			} else {
				this.emit(messageEvent, event);
			}
		};

		// Listen for socket opening
		this._socket.onopen = (event) => {

			// Set the started flag
			this._started = true;
			this._opening = false;

			// Emit the open event of the socket
			this.emit(openEvent, event);
		};

		return this;
	}

	/**
	 * Send data via the WebSocket connection
	 * @param {string} event
	 * @param {*} data
	 * @param {Listener} callback
	 * @returns {this}
	 */
	send(event, data, callback) {

		// Check for open socket and send the message
		if (this._started) {
			try {

				let message = event;

				// Prepare the message
				if (this._advanced) {
					message = JSON.stringify({
						data,
						event
					});
				} else if (!WS.canSend(message)) {
					message = JSON.stringify(message);
				}

				// Send the prepared message to the underlying socket
				this._socket.send(message);

				// Listen for event response in advanced mode
				if (this._advanced && typeof callback === 'function') {
					this.once(event, callback);
				}
			} catch (error) {
				this.emit(errorEvent, error);
			}
		} else {

			// Wait for open event to try to send again the provided data
			this.once(openEvent, () => {
				this.send(event, data, callback);
			});

			// If connection is down then open a new one
			if (!this._opening) {
				this.open();
			}
		}

		return this;
	}

	/**
	 * Check if the provided message can be sent via WebSocket interface
	 * @param {*} message
	 * @returns {boolean}
	 */
	static canSend(message) {

		const isString = (typeof message === 'string');
		const isArrayBuffer = (message instanceof ArrayBuffer);
		const isArrayBufferView = ArrayBuffer.isView(message);

		return (isString || isArrayBuffer || isArrayBufferView);
	}

	/**
	 * Normalizes provided path to be used in WebSocket constructor
	 * @param {string} input
	 * @returns {string}
	 */
	static normalizeURL(input) {

		const location = window.location;
		const url = new URL(input, location.href);

		let protocol = wsProtocol;

		// Get the protocol name
		if (location.protocol === httpsProtocol) {
			protocol += securedProtocolSuffix;
		}

		// Set the proper protocol
		url.protocol = protocol;

		return url.href;
	}
}

export default (path, options) => new WS().open(path, options);