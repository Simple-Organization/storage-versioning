import type { StorageVersioningJSON } from '.';
import type { StorageItems, StorageVersioning, StorageVersions } from './types';
import { store } from 'simorg-store';

//
//

export function storageVersioning<T extends StorageItems>(
  versioning: StorageVersions<T>,
  initial: T = {} as any,
  noLocalStorage = false,
): StorageVersioning<T> {
  const timeouts: Record<string, any> = {};
  const internalStore = store(initial);

  //
  //

  let load: <K extends keyof T>(key: K) => T[K] | null;
  let save: <K extends keyof T>(key: K, data: T[K], exp?: Date) => void;
  let listen: () => () => void;

  //
  //

  if (noLocalStorage) {
    //
    //

    save = (key, data): void => {
      if (data !== null && data !== undefined) {
        setValue(key, data);
      } else {
        setValue(key, data);
      }
    };

    //
    //

    load = (key): any => {
      return internalStore.get()[key];
    };

    //
    //

    listen = () => () => {};
  } else {
    //
    //

    save = (key, data, exp): void => {
      clearTimeout(timeouts[key as string]);

      //
      //

      if (data !== null && data !== undefined) {
        const dataToSave: StorageVersioningJSON<T> = {
          data,
        };

        //
        const _versioning = versioning[key as string] as any;

        if (_versioning) {
          if (typeof _versioning === 'function') {
            dataToSave.data = _versioning(data);
          } else {
            dataToSave.v = _versioning;
          }
        }

        //

        if (exp) {
          dataToSave.exp = exp.getTime();
          const now = new Date().getTime();
          const diff = dataToSave.exp - now;

          if (diff > 0) {
            timeouts[key as string] = setTimeout(() => {
              setValue(key, null);
            }, diff);
          }
        }

        localStorage.setItem(key as string, JSON.stringify(dataToSave));
        setValue(key, data);
      } else {
        localStorage.removeItem(key as string);
        setValue(key, null);
      }
    };

    //
    //

    load = (key): any => {
      clearTimeout(timeouts[key as string]);

      try {
        const strItem = localStorage.getItem(key as string);
        if (!strItem) return setValue(key, null);

        //

        const parsed: StorageVersioningJSON<T> = JSON.parse(strItem);

        //

        const _versioning = versioning[key as string] as any;

        if (typeof _versioning === 'function') {
          parsed.data = _versioning(parsed.data);
        } else {
          if (parsed.v !== _versioning) {
            return setValue(key, null);
          }
        }

        //

        if (parsed.exp) {
          const now = new Date().getTime();
          const diff = parsed.exp - now;

          //

          if (diff > 0) {
            timeouts[key as string] = setTimeout(() => {
              setValue(key, null);
            }, diff);
          } else {
            return setValue(key, null);
          }
        }

        return setValue(key, parsed.data as any);
      } catch (error) {
        console.error(
          `[Error loading localStorage for ${key as string}]`,
          error,
        );
      }

      return setValue(key, null);
    };

    //
    //

    listen = () => {
      const onStorage = (event: StorageEvent) => {
        if ((event.key as string) in versioning) {
          load(event.key as any);
        }
      };

      window.addEventListener('storage', onStorage);

      return () => {
        window.removeEventListener('storage', onStorage);
      };
    };
  }

  //
  //

  function setValue<K extends keyof T>(key: K, data: T[K] | null): T[K] | null {
    const value = internalStore.get();
    if (value[key] === data) return data;

    internalStore.set({ ...value, [key]: data });
    return data;
  }

  //
  //

  function loadAll(): T {
    const keys = Object.keys(versioning) as Array<keyof T>;

    for (const key of keys) {
      load(key);
    }

    return internalStore.get();
  }

  //
  //

  return {
    load,
    save,
    listen,
    get(key?: string): any {
      if (key) return internalStore.get()[key];
      return internalStore.get();
    },
    subscribe: internalStore.subscribe,
    set: internalStore.set,
    loadAll,
  };
}
