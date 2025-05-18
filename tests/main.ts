import { s } from 'schemas-lib';
import { storageVersioning } from '../src';

//
//

localStorage.clear();

const schema = s.int().catch(1);

(window as any).__schema = schema;
(window as any).__currentStorageVersioning = storageVersioning;
