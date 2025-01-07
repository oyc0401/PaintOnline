import localforage from "localforage";

console.log('JS 실행:', 'keyStore.js');
// @ts-check

/**
 * A simplified key-value store using localforage.
 */
const keyStore = {
  /**
   * Retrieves the value associated with the given key from storage.
   * @param {string} key - The key to retrieve.
   * @returns {Promise<any>} A promise that resolves to the stored value, or null if not found.
   */
  async get(key) {
    return await localforage.getItem(key);
  },

  /**
   * Sets a value in storage for the given key.
   * @param {string} key - The key to store the value under.
   * @param {any} value - The value to store.
   * @returns {Promise<void>} A promise that resolves when the value is successfully stored.
   */
  async set(key, value) {
    await localforage.setItem(key, value);
  },
};

export { keyStore };