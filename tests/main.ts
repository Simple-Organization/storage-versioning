import { int } from 'schemas-lib';
import { storageVersioning } from '../src';
import { store } from 'simorg-store';

//
//

localStorage.clear();

const schema = int().catch(1);

(window as any).__schema = schema;
(window as any).__currentStorageVersioning = storageVersioning;
