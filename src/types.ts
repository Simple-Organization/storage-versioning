
//
//

export type StorageItems = {
  [key: string]: any;
};

//
//

export type StorageVersions<T extends StorageItems> = {
  [K in keyof T]: string | number | ((value: T[K]) => T[K]);
};

//
//

export interface StorageVersioning<T extends StorageItems>
  extends WritableSignal<T> {
  /**
   * Load the data from the localStorage
   *
   * If the data is expired, it will return null
   *
   * If the version is different, it will return null
   *
   * @param key the key to load
   * @returns the data related to that key or null
   */
  load<K extends keyof T>(key: K): T[K] | null;

  /**
   * Get the data from the localStorage
   */
  get(): T;

  /**
   * Get specific data from the localStorage
   *
   * @param key the key to get
   */
  get<K extends keyof T>(key: K): T[K] | null;

  /**
   * Save the data to the localStorage
   *
   * If the expiration date is set, the data will be removed after the expiration date
   *
   * If data is null, the data will be removed
   *
   * @param key the key to save
   * @param data the data to save
   * @param exp the expiration date
   */
  save<K extends keyof T>(key: K, data: T[K], exp?: Date): void;

  /**
   * Add the event listener to listen the window storage event
   * @returns a function to remove the event listener
   */
  listen(): () => void;

  /**
   * Load all the data from the localStorage
   */
  loadAll(): T;
}

/**
 * Represents a signal/atom that holds a value and allows subscribing to changes.
 */
type ReadableSignal<T = any> = {
  /**
   * The current value of the signal/atom.
   */
  get: () => T;
  /**
   * Subscribes to changes in the signal/atom.
   * @param callback - The function to call when the signal/atom's value changes.
   * @returns A function that unsubscribes the callback from the signal/atom.
   */
  subscribe: (callback: (value: T) => void) => () => void;
};

/**
 * Represents a signal/atom that holds a value and allows subscribing to changes.
 */
interface WritableSignal<T = any> extends ReadableSignal<T> {
    /**
     * Sets the value of the signal/atom.
     */
    set: (value: T) => void;
}
