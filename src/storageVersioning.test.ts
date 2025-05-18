import { expect, test, beforeEach, afterEach } from 'bun:test';
import { storageVersioning } from './storageVersioning';
import { s } from 'schemas-lib';

let localStorageData: Record<string, string | null> = {};

// Limpa o localStorage antes de cada teste
beforeEach(() => {
  globalThis.localStorage = {
    getItem: (key: string) => {
      return localStorageData[key] || null;
    },
    setItem: (key: string, value: string) => {
      localStorageData[key] = value + '';
    },
    removeItem: (key: string) => {
      delete localStorageData[key];
    },
    clear: () => {
      localStorageData = {};
    },
  } as any;

  localStorageData = {};
});

//
//

test('Precisa dar erro caso o schema enviado não tem default()', () => {
  expect(() => {
    storageVersioning({ foo: s.trimmed() }, { foo: 'bar' });
  }).toThrow();
});

//
//

test('new Storage must have each property and not parse using schemas-lib', async () => {
  const versioning = {
    name: s.nome().default('John'),
    age: s.int().min(10).max(100).default(null),
    address: s
      .trimmed()
      .default(null)
      .transform((data: string) => data.toUpperCase()),
  };

  const initial = {
    name: 'John',
    age: 30,
    address: '123 Main St',
  };

  const storage = storageVersioning(versioning, initial);

  expect(storage.name.value).toBe('John');
  expect(storage.age.value).toBe(30);
  expect(storage.address.value).toBe('123 Main St');
});

//
//

test('save and load simple value', () => {
  const versioning = { foo: s.trimmed().default() };
  const storage = storageVersioning(versioning, { foo: 'bar' });

  storage.save('foo', 'baz');

  expect(localStorage.getItem('foo')).toBe('{"data":"baz"}');

  expect(storage.foo.value).toBe('baz');
  expect(storage.load('foo')).toBe('baz');
});

//
//

test('function versioning transforms value', async () => {
  const versioning = {
    foo: s
      .trimmed()
      .transform((data: any) => (/!$/.test(data) ? data : data + '!'))
      .default(),
  };

  const storage = storageVersioning(versioning);

  storage.save('foo', 'baz');

  expect(storage.foo.value).toBe('baz!');
  expect(storage.load('foo')).toBe('baz!');
});

//
//

test('expiration removes value after time', async () => {
  const versioning = { foo: s.any().default() };
  const storage = storageVersioning(versioning);

  const exp = new Date(Date.now() + 50); // 50ms
  storage.save('foo', 'baz', exp);
  expect(storage.foo.value).toBe('baz');

  await new Promise((res) => setTimeout(res, 60));
  expect(storage.foo.value).toBe(null);
});

//
//

test('removing value sets it to null', () => {
  const versioning = { foo: s.any().default() };
  const storage = storageVersioning(versioning, { foo: 'bar' as any });

  storage.save('foo', null);
  expect(storage.foo.value).toBe(null);
  expect(localStorage.getItem('foo')).toBe(null);
});

//
//

test('loadAll loads all keys', () => {
  const versioning = { a: s.string().default(), b: s.string().default() };
  const storage = storageVersioning(versioning, { a: 'x', b: 'y' });

  storage.save('a', 'A');
  storage.save('b', 'B');
  storage.save('a', 'AA');

  // Limpa sinais para simular reload
  const storage2 = storageVersioning(versioning, { a: '', b: '' });
  storage2.loadAll();
  expect(storage2.a.value).toBe('AA');
  expect(storage2.b.value).toBe('B');
});

//
//

test('Caso tenha um valor definido com default, deve sempre retornar o valor definido como default', () => {
  const versioning = { foo: s.any().default('value') };
  const storage = storageVersioning(versioning);

  // O valor só é definido quando lêmos o valor
  storage.loadAll();
  expect(storage.foo.value).toBe('value');

  storage.save('foo', 'foo');
  expect(storage.foo.value).toBe('foo');

  storage.save('foo', null);
  expect(storage.foo.value).toBe('value');

  // Limpa sinais para simular reload
  const storage2 = storageVersioning(versioning);
  storage2.loadAll();

  expect(storage2.foo.value).toBe('value');
  expect(localStorage.getItem('foo')).toBe(null);
});

//
//

test('Caso dê erro no localStorage, ele deve definir o valor padrão', () => {
  const versioning = { foo: s.any().default('value') };

  localStorage.getItem = () => {
    throw new Error('Erro no localStorage');
  };

  const storage = storageVersioning(versioning);

  // O valor só é definido quando lêmos o valor
  const oldConsoleError = console.error;
  console.error = () => {
    console.log(
      'console.error foi substituído momentaneamente para não poluir o console',
    );
  };
  storage.loadAll();
  console.error = oldConsoleError;
  expect(storage.foo.value).toBe('value');
});
