type Listener<T> = (...args: T[]) => void;

type WSOptions = {
	advanced?: boolean,
	protocols?: string | string[]
};

declare class WS<D> {

	/**
	 * Container to store user data
	 */
	data: D;

	/**
	 * Close the WebSocket
	 */
	close(code?: number, reason?: string): this;

	/**
	 * Dispatch an event
	 */
	emit<T>(event: string, ...args: T[]): boolean;

	/**
	 * Remove one event listener, all listeners of an event, or all of them
	 */
	off<T>(event?: string, listener?: Listener<T>): this;

	/**
	 * Append a listener for an event
	 */
	on<T>(event: string, listener: Listener<T>): this;

	/**
	 * Append an one time listener for an event
	 */
	once<T>(event: string, listener: Listener<T>): this;

	/**
	 * Open or reopen the WebSocket connection
	 */
	open(url?: string, options?: WSOptions): this;

	/**
	 * Open or reopen the WebSocket connection
	 */
	open(options: WSOptions): this;

	/**
	 * Send data via the WebSocket connection
	 */
	send<S, T>(event: string, data: S, callback?: Listener<T>): this;

	/**
	 * Send data via the WebSocket connection
	 */
	send<S>(data: S): this;
}

declare function ws<D>(url?: string, options?: WSOptions): WS<D>;

declare function ws<D>(options: WSOptions): WS<D>;

export default ws;