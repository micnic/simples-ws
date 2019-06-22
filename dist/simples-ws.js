(function (global, factory) {
  if (typeof define === "function" && define.amd) {
    define("ws", ["exports"], factory);
  } else if (typeof exports !== "undefined") {
    factory(exports);
  } else {
    var mod = {
      exports: {}
    };
    factory(mod.exports);
    global.ws = mod.exports;
  }
})(this, function (_exports) {
  "use strict";

  Object.defineProperty(_exports, "__esModule", {
    value: true
  });
  _exports["default"] = void 0;

  function _typeof(obj) { if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") { _typeof = function _typeof(obj) { return typeof obj; }; } else { _typeof = function _typeof(obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }; } return _typeof(obj); }

  function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

  function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

  function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); return Constructor; }

  var closeEvent = 'close'; // Close event string

  var errorEvent = 'error'; // Error event string

  var httpsProtocol = 'https:'; // HTTPS protocol value in location string

  var messageEvent = 'message'; // Message event string

  var openEvent = 'open'; // Open event string

  var securedProtocolSuffix = 's'; // Suffix for secured protocols

  var wsProtocol = 'ws'; // WS protocol name

  var unspecifiedError = Error('Uncaught, unspecified "error" event.');
  var messageParsingError = Error('Can not parse message');

  var WS =
  /*#__PURE__*/
  function () {
    /**
     * WS constructor
     * @param {string} path
     * @param {WSOptions} options
     */
    function WS(path, options) {
      _classCallCheck(this, WS);

      var advanced = false;
      var config = options;
      var protocols = []; // Make path argument optional

      if (_typeof(path) === 'object') {
        config = path;
      } // Check for provided config


      if (config && _typeof(config) === 'object') {
        // Check for advanced mode
        advanced = config.advanced === true; // Get the WebSocket sub-protocols

        if (Array.isArray(config.protocols)) {
          protocols = config.protocols.filter(function (element) {
            return typeof element === 'string';
          });
        } else if (typeof config.protocols === 'string') {
          protocols.push(config.protocols);
        }
      } // Define public WebSocket properties


      this.data = {}; // Define private WebSocket properties

      this._advanced = advanced;
      this._events = new Map();
      this._url = WS.normalizeURL(path);
      this._opening = false;
      this._protocols = protocols;
      this._socket = null;
      this._started = false;
    }
    /**
     * Close the WebSocket
     * @param {number} code
     * @param {string} reason
     * @returns {this}
     */


    _createClass(WS, [{
      key: "close",
      value: function close(code, reason) {
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

    }, {
      key: "emit",
      value: function emit(event) {
        var _this = this;

        for (var _len = arguments.length, args = new Array(_len > 1 ? _len - 1 : 0), _key = 1; _key < _len; _key++) {
          args[_key - 1] = arguments[_key];
        }

        // Throw the error if there are no listeners for error event
        if (event === errorEvent && !this._events.has(errorEvent)) {
          if (args[0] instanceof Error) {
            throw args[0];
          } else {
            throw unspecifiedError;
          }
        } // Check if the event has listeners


        if (this._events.has(event)) {
          this._events.get(event).forEach(function (listener) {
            listener.apply(_this, args);
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

    }, {
      key: "off",
      value: function off(event, listener) {
        // Check for provided arguments to remove the selected listeners
        if (event && listener) {
          if (this._events.has(event)) {
            var index = this._events.get(event).indexOf(listener); // Check if listener is found to remove it


            if (index >= 0) {
              this._events.get(event).splice(index, 1);
            }
          }
        } else if (event) {
          if (this._events.has(event)) {
            this._events["delete"](event);
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

    }, {
      key: "on",
      value: function on(event, listener) {
        // Check if listener is a function
        if (typeof listener === 'function') {
          var listeners = this._events.get(event); // Create the event listeners container if it is missing


          if (!listeners) {
            listeners = [];

            this._events.set(event, listeners);
          } // Add the listener to the list


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

    }, {
      key: "once",
      value: function once(event, listener) {
        var _this2 = this;

        var onceListener = function onceListener() {
          for (var _len2 = arguments.length, args = new Array(_len2), _key2 = 0; _key2 < _len2; _key2++) {
            args[_key2] = arguments[_key2];
          }

          listener.apply(_this2, args);

          _this2.off(event, onceListener);
        };

        return this.on(event, onceListener);
      }
      /**
       * Open or reopen the WebSocket connection
       * @returns {this}
       */

    }, {
      key: "open",
      value: function open(path, options) {
        var _this3 = this;

        var config = options; // Make path and options arguments optional

        if (_typeof(path) === 'object') {
          config = path;
        } else if (typeof path === 'string') {
          this._url = WS.normalizeURL(path);
        } // Check for provided config


        if (config && _typeof(config) === 'object') {
          // Check for changed advanced mode
          if (config.advanced) {
            this._advanced = config.advanced === true;
          } // Get the WebSocket sub-protocols


          if (Array.isArray(config.protocols)) {
            this._protocols = config.protocols.filter(function (element) {
              return typeof element === 'string';
            });
          } else if (typeof config.protocols === 'string') {
            this._protocols.push(config.protocols);
          }
        } // Set the opening flag


        this._opening = true; // Close the previously used socket

        this.close(); // Initialize the WebSocket

        this._socket = new WebSocket(this._url, this.protocols); // Listen for socket close

        this._socket.onclose = function (event) {
          _this3._started = false;

          _this3.emit(closeEvent, event);
        }; // Catch socket errors


        this._socket.onerror = function (error) {
          _this3._started = false;

          _this3.emit(errorEvent, error);
        }; // Listen for incoming messages


        this._socket.onmessage = function (event) {
          // Parse and emit the received data
          if (_this3._advanced) {
            var message = event; // Try to parse JSON data from the message

            try {
              message = JSON.parse(message.data);
            } catch (error) {
              _this3.emit(errorEvent, messageParsingError);
            } finally {
              if (message === event) {
                _this3.emit(messageEvent, event);
              } else {
                _this3.emit(message.event, message.data);
              }
            }
          } else {
            _this3.emit(messageEvent, event);
          }
        }; // Listen for socket opening


        this._socket.onopen = function (event) {
          // Set the started flag
          _this3._started = true;
          _this3._opening = false; // Emit the open event of the socket

          _this3.emit(openEvent, event);
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

    }, {
      key: "send",
      value: function send(event, data, callback) {
        var _this4 = this;

        // Check for open socket and send the message
        if (this._started) {
          try {
            var message = event; // Prepare the message

            if (this._advanced) {
              message = JSON.stringify({
                data: data,
                event: event
              });
            } else if (!WS.canSend(message)) {
              message = JSON.stringify(message);
            } // Send the prepared message to the underlying socket


            this._socket.send(message); // Listen for event response in advanced mode


            if (this._advanced && typeof callback === 'function') {
              this.once(event, callback);
            }
          } catch (error) {
            this.emit(errorEvent, error);
          }
        } else {
          // Wait for open event to try to send again the provided data
          this.once(openEvent, function () {
            _this4.send(event, data, callback);
          }); // If connection is down then open a new one

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

    }], [{
      key: "canSend",
      value: function canSend(message) {
        var isString = typeof message === 'string';
        var isArrayBuffer = message instanceof ArrayBuffer;
        var isArrayBufferView = ArrayBuffer.isView(message);
        return isString || isArrayBuffer || isArrayBufferView;
      }
      /**
       * Normalizes provided path to be used in WebSocket constructor
       * @param {string} path
       * @returns {string}
       */

    }, {
      key: "normalizeURL",
      value: function normalizeURL(path) {
        var location = window.location;
        var protocol = wsProtocol;
        var url = new URL(location.href); // Check for provided path string to normalize it

        if (typeof path === 'string') {
          url = new URL(path, location.href);
        } // Get the protocol name


        if (location.protocol === httpsProtocol) {
          protocol += securedProtocolSuffix;
        } // Set the proper protocol


        url.protocol = protocol;
        return url.href;
      }
    }]);

    return WS;
  }();

  var _default = function _default(location, options) {
    return new WS(location, options).open();
  };

  _exports["default"] = _default;
});
