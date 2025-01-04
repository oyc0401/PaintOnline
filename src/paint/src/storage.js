console.log('JS 실행:', 'storage.js');
// @ts-check

// @TODO: maybe replace this module with localforage or similar
// (but need to address asynchronous concerns if doing that)

/** @type {LocalStore} */
const localStore = {
	/**
	 * See overrides in interface LocalStore.
	 * @param {string | string[] | Record<string, string>} key_or_keys_or_pairs
	 * @param {((error: Error, value_or_values?: string) => void) | ((error: Error, value_or_values?: Record<string, string>) => void)} callback
	 */
	get(key_or_keys_or_pairs, callback) {
		const request = indexedDB.open('MyDatabase', 2);

		request.onupgradeneeded = function (event) {
			const db = event.target.result;
			if (!db.objectStoreNames.contains('store')) {
				db.createObjectStore('store', { keyPath: 'key' });
			}
		};

		request.onsuccess = function (event) {
			const db = event.target.result;
			const transaction = db.transaction('store', 'readonly');
			const store = transaction.objectStore('store');

			if (typeof key_or_keys_or_pairs === 'string') {
				const getRequest = store.get(key_or_keys_or_pairs);
				getRequest.onsuccess = function () {
					callback(null, getRequest.result ? getRequest.result.value : null);
				};
				getRequest.onerror = function () {
					callback(getRequest.error);
				};
			} else if (Array.isArray(key_or_keys_or_pairs)) {
				const result = {};
				let completed = 0;
				key_or_keys_or_pairs.forEach((key) => {
					const getRequest = store.get(key);
					getRequest.onsuccess = function () {
						if (getRequest.result) {
							result[key] = getRequest.result.value;
						}
						completed++;
						if (completed === key_or_keys_or_pairs.length) {
							callback(null, result);
						}
					};
					getRequest.onerror = function () {
						callback(getRequest.error);
					};
				});
			} else {
				const keysWithDefaults = key_or_keys_or_pairs;
				const result = {};
				let completed = 0;
				for (const key in keysWithDefaults) {
					const defaultValue = keysWithDefaults[key];
					const getRequest = store.get(key);
					getRequest.onsuccess = function () {
						result[key] = getRequest.result ? getRequest.result.value : defaultValue;
						completed++;
						if (completed === Object.keys(keysWithDefaults).length) {
							callback(null, result);
						}
					};
					getRequest.onerror = function () {
						callback(getRequest.error);
					};
				}
			}
		};

		request.onerror = function (event) {
			callback(event.target.error);
		};
	},

	/**
	 * See overrides in interface LocalStore.
	 * @param {string | Record<string, string>} key_or_pairs
	 * @param {string | ((error: Error) => void)} value_or_callback
	 * @param {(error: Error) => void} [callback]
	 */
	set(key_or_pairs, value_or_callback, callback) {
		const request = indexedDB.open('MyDatabase', 2);

		request.onupgradeneeded = function (event) {
			const db = event.target.result;
			if (!db.objectStoreNames.contains('store')) {
				db.createObjectStore('store', { keyPath: 'key' });
			}
		};

		request.onsuccess = function (event) {
			const db = event.target.result;
			const transaction = db.transaction('store', 'readwrite');
			const store = transaction.objectStore('store');

			if (typeof key_or_pairs === 'string') {
				const key = key_or_pairs;
				const value = value_or_callback;
				const putRequest = store.put({ key, value });
				putRequest.onsuccess = function () {
					if (callback) callback(null);
				};
				putRequest.onerror = function () {
					if (callback) callback(putRequest.error);
				};
			} else {
				const keyValuePairs = key_or_pairs;
				let completed = 0;
				const keys = Object.keys(keyValuePairs);
				keys.forEach((key) => {
					const value = keyValuePairs[key];
					const putRequest = store.put({ key, value });
					putRequest.onsuccess = function () {
						completed++;
						if (completed === keys.length && callback) {
							callback(null);
						}
					};
					putRequest.onerror = function () {
						if (callback) callback(putRequest.error);
					};
				});
			}
		};

		request.onerror = function (event) {
			if (callback) callback(event.target.error);
		};
	},
};

export { localStore };