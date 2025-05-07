import { test, expect } from '@playwright/test';
import { int, Schema } from 'schemas-lib';
import { storageVersioning } from '../src/storageVersioning';

//
//

declare const __schema: Schema<number | null | undefined>;
declare const __currentStorageVersioning: typeof storageVersioning;

//
//

type StorageItems1 = {
  key1: string | null | Record<string, string>;
};

type StorageItems2 = {
  key1: string | null | Record<string, string>;
  key2: string | null | Record<string, string>;
};

//
//

test('Must show Data 1', async ({ page }) => {
  await page.goto('http://localhost:5173/');

  const textToFind = 'DATA 1';
  const div = page.locator(`div:has-text("${textToFind}")`);

  // Expect a title "to contain" a substring.
  expect(await div.count()).toBe(1);
});

//
//

test('StorageVersioning must save and load successfully', async ({ page }) => {
  await page.goto('http://localhost:5173/');

  //
  // Must start with null

  const result1 = await page.evaluate(() => {
    const storage = __currentStorageVersioning<StorageItems1>({
      key1: 1,
    });

    return storage.load('key1');
  });

  expect(result1).toEqual(null);

  //
  // Will save, and when load must be the same

  const result2 = await page.evaluate(() => {
    const storage = __currentStorageVersioning<StorageItems1>({
      key1: 1,
    });

    storage.save('key1', { name: 'John' });

    return storage.load('key1');
  });

  expect(result2).toEqual({ name: 'John' });

  //
  // Will only load, must be the same

  const result3 = await page.evaluate(() => {
    const storage = __currentStorageVersioning<StorageItems1>({
      key1: 1,
    });

    return storage.load('key1');
  });

  expect(result3).toEqual({ name: 'John' });
});

//
//

test('When change version, must return null', async ({ page }) => {
  await page.goto('http://localhost:5173/');

  //
  // Must save with version 1

  const result1 = await page.evaluate(() => {
    const storage = __currentStorageVersioning<StorageItems1>({
      key1: 1,
    });

    storage.save('key1', { name: 'John' });

    return storage.load('key1');
  });

  expect(result1).toEqual({ name: 'John' });

  //
  // Must return John with the same version

  const result2 = await page.evaluate(() => {
    const storage = __currentStorageVersioning<StorageItems1>({
      key1: 1,
    });

    return storage.load('key1');
  });

  expect(result2).toEqual({ name: 'John' });

  //
  // Must return null if the version is different

  const result3 = await page.evaluate(() => {
    const storage = __currentStorageVersioning({
      key1: 2,
    });

    return storage.load('key1');
  });

  expect(result3).toEqual(null);

  //
  // Must return John if back to the same version

  const result4 = await page.evaluate(() => {
    const storage = __currentStorageVersioning({
      key1: 1,
    });

    return storage.load('key1');
  });

  expect(result4).toEqual({ name: 'John' });
});

//
//

test('Must expirate', async ({ page }) => {
  await page.goto('http://localhost:5173/');

  //
  // Must start with null

  const result1 = await page.evaluate(() => {
    const storage = __currentStorageVersioning({
      key1: 1,
    });

    const exp = new Date();
    exp.setMilliseconds(exp.getMilliseconds() + 100);

    storage.save('key1', { name: 'John' }, exp);

    return storage.load('key1');
  });

  expect(result1).toEqual({ name: 'John' });

  //
  // Wait 1.2 seconds
  await page.waitForTimeout(150);

  //
  // Will save, and when load must be the same

  const result2 = await page.evaluate(() => {
    const storage = __currentStorageVersioning({
      key1: 1,
    });

    return storage.load('key1');
  });

  expect(result2).toEqual(null);
});

//
//

test('Expiration must notify', async ({ page }) => {
  await page.goto('http://localhost:5173/');

  //
  // Must start with null

  const result1 = await page.evaluate(() => {
    const storage = __currentStorageVersioning<StorageItems1>({
      key1: 1,
    });

    const exp = new Date();
    exp.setMilliseconds(exp.getMilliseconds() + 100);

    storage.save('key1', 'Jhon', exp);

    let initial = true;
    const unsub = storage.subscribe((values) => {
      if (initial) {
        initial = false;
        return;
      }

      document.title = values.key1 + '';
      unsub();
    });

    return storage.load('key1');
  });

  expect(result1).toEqual('Jhon');

  //
  // Wait 1.2 seconds
  await page.waitForTimeout(150);

  //
  // Will save, and when load must be the same

  expect(await page.title()).toBe('null');
});

//
//

test('Expiration must notify without save', async ({ page }) => {
  await page.goto('http://localhost:5173/');

  //
  // Change the localStorage manually

  await page.evaluate(() => {
    const exp = new Date();
    exp.setMilliseconds(exp.getMilliseconds() + 100);

    localStorage.setItem(
      'key1',
      JSON.stringify({
        v: 1,
        data: 'Jhon',
        exp: exp.getTime(),
      }),
    );
  });

  //
  // Must expirate and notify without calling save method

  const result1 = await page.evaluate(() => {
    const storage = __currentStorageVersioning<StorageItems1>({
      key1: 1,
    });

    let initial = true;
    storage.subscribe((values) => {
      if (initial) {
        initial = false;
        return;
      }

      document.title = values.key1 + '';
    });

    return storage.load('key1');
  });

  expect(result1).toEqual('Jhon');

  //
  // Wait 1.2 seconds
  await page.waitForTimeout(150);

  //
  // Will save, and when load must be the same

  expect(await page.title()).toBe('null');
});

//
//

test('storageGroup must load all storages', async ({ page }) => {
  await page.goto('http://localhost:5173/');

  //
  // Must start with null

  const result1 = await page.evaluate(() => {
    const storage = __currentStorageVersioning<StorageItems2>({
      key1: 1,
      key2: 2,
    });

    storage.save('key1', 'John');
    storage.save('key2', 'Doe');

    return storage.get();
  });

  expect(result1).toEqual({
    key1: 'John',
    key2: 'Doe',
  });
});

//
//

test('Must validate with schemas-lib when save', async ({ page }) => {
  const schema = int().catch(1);

  expect(schema.parse(1)).toBe(1);
  expect(schema.parse('asdasfasdas')).toBe(1);

  //
  //

  await page.goto('http://localhost:5173/');

  const result1 = await page.evaluate(() => {
    const storage = __currentStorageVersioning<StorageItems1>({
      key1: (data) => __schema.parse(data) as any as string,
    });

    // When save it will be parsed to 1
    // because it is not a number
    // the schema is in main.ts file
    storage.save('key1', 'John' as any);

    storage.load('key1');

    return storage.get().key1;
  });

  //
  //

  expect(result1).toBe(1);
});

//
//

test('Must validate with schemas-lib when load', async ({ page }) => {
  await page.goto('http://localhost:5173/');

  const result1 = await page.evaluate(() => {
    const storage = __currentStorageVersioning<StorageItems1>({
      key1: 33,
    });
    storage.save('key1', 'John' as any); // Save a string, but the schema requires a number

    //
    //

    const storage2 = __currentStorageVersioning<StorageItems1>({
      key1: (data) => __schema.parse(data) as any as string,
    });

    // When load it will be parsed to 1
    // because it is not a number
    // the schema is in main.ts file
    storage2.load('key1');

    return storage2.get().key1;
  });

  //
  //

  expect(result1).toBe(1);
});

//
//

test('Must load a wrong format localStorage item', async ({ page }) => {
  await page.goto('http://localhost:5173/');

  const result1 = await page.evaluate(() => {
    const storage = __currentStorageVersioning<StorageItems1>({
      key1: 33,
    });
    storage.save('key1', 'John' as any); // Save a string, but the schema requires a number

    localStorage.removeItem('key1');

    storage.load('key1');

    return storage.get('key1');
  });

  //
  //

  expect(result1).toBe(null);
});

//
//

test('When localStorage is null, it must return null when load', async ({
  page,
}) => {
  await page.goto('http://localhost:5173/');

  const result1 = await page.evaluate(() => {
    localStorage.setItem('key1', 'wrong format');

    //
    //

    const storage2 = __currentStorageVersioning<StorageItems1>({
      key1: (data) => __schema.parse(data) as any as string,
    });

    // When load it will be parsed to 1
    // because it is not a number
    // the schema is in main.ts file
    storage2.load('key1');

    return storage2.get().key1;
  });

  //
  //

  expect(result1).toBe(null);
});

//
//

test('Must get individual item from individual store', async ({ page }) => {
  await page.goto('http://localhost:5173/');

  const result1 = await page.evaluate(() => {
    const storage = __currentStorageVersioning<StorageItems1>({
      key1: 33,
    });
    storage.save('key1', 'John' as any); // Save a string, but the schema requires a number

    return storage.key1.get();
  });

  //

  expect(result1).toBe('John');
});

//
//

test('Must get individual item from subscribe from individual store', async ({ page }) => {
  await page.goto('http://localhost:5173/');

  const result1 = await page.evaluate(() => {
    const storage = __currentStorageVersioning<StorageItems1>({
      key1: 33,
    });
    
    let initial = true;
    const unsub = storage.key1.subscribe((value) => {
      if (initial) {
        initial = false;
        return;
      }

      document.title = value + '';
      unsub();
    });

    storage.save('key1', 'John' as any);

    return storage.key1.get();
  });

  //

  expect(result1).toBe('John');

  expect(await page.title()).toBe('John');
});