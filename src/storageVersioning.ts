import type {
  StorageItems,
  StorageVersioning,
  StorageVersioningJSON,
  StorageVersions,
} from './types';
import { Signal, signal } from '@preact/signals';

//
//

export function storageVersioning<T extends StorageItems>(
  versioning: StorageVersions<T>,
  initial: T = {} as any,
): StorageVersioning<T> & { [K in keyof T]: Signal<T[K]> } {
  const timeouts: Record<string, any> = {};

  // Cria um store separado para cada propriedade
  const propertyStores = {} as { [K in keyof T]: Signal<T[K]> };

  for (const key of Object.keys(versioning) as Array<keyof T>) {
    propertyStores[key] = signal(initial[key]);
  }

  //
  //

  function save<K extends keyof T>(key: K, data: T[K], exp?: Date): void {
    clearTimeout(timeouts[key as string]);

    if (data !== null && data !== undefined) {
      const dataToSave: StorageVersioningJSON<T> = {
        data,
      };

      dataToSave.data = versioning[key as string].parse(data);

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
  }

  function load<K extends keyof T>(key: K): T[K] | null {
    clearTimeout(timeouts[key as string]);

    try {
      const strItem = localStorage.getItem(key as string);
      if (!strItem) return setValue(key, null);

      const parsed: StorageVersioningJSON<T> = JSON.parse(strItem);

      const _versioning = versioning[key as string] as any;

      if (typeof _versioning === 'function') {
        parsed.data = _versioning(parsed.data);
      } else {
        if (parsed.v !== _versioning) {
          return setValue(key, null);
        }
      }

      if (parsed.exp) {
        const now = new Date().getTime();
        const diff = parsed.exp - now;

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
      console.error(`[Error loading localStorage for ${key as string}]`, error);
    }

    return setValue(key, null);
  }

  function listen() {
    const onStorage = (event: StorageEvent) => {
      if ((event.key as string) in versioning) {
        load(event.key as any);
      }
    };

    window.addEventListener('storage', onStorage);

    return () => {
      window.removeEventListener('storage', onStorage);
    };
  }

  //
  //

  function setValue<K extends keyof T>(key: K, data: T[K] | null): T[K] | null {
    propertyStores[key].value = data as T[K];
    return data;
  }

  //
  //

  function loadAll(): void {
    const keys = Object.keys(versioning) as Array<keyof T>;

    for (const key of keys) {
      load(key);
    }
  }

  //
  //

  return Object.assign(
    {
      load,
      save,
      listen,
      loadAll,
    },
    propertyStores,
  );
}
