# storage-versioning

`storage-versioning` é uma biblioteca frontend que utiliza eventos de armazenamento do navegador (`window.storage` event) para sincronizar o `localStorage` entre diferentes abas do navegador. Isso é útil para garantir que as mudanças no armazenamento local sejam refletidas em todas as abas abertas da aplicação.

## Recursos

- Sincronização automática do `localStorage` entre abas
- Gerenciamento de versões de `localStorage` usando exclusivamente [schemas-lib](https://github.com/Simple-Organization/schemas-lib)
- Expiração da chave por tempo
- Reatividade usando [@preact/signals](https://preactjs.com/guide/v10/signals/)

## Instalação

Você pode instalar o `storage-versioning` via npm:

```bash
npm i storage-versioning
pnpm i storage-versioning
yarn add storage-versioning
bun add storage-versioning
```

### Definindo storageVersioning

```ts
import { s } from 'schemas-lib';

export type Items = {
  user: LoggedUser;
  person: PersonObject;
};

const userSchema = s
  .object({
    name: s.string(),
    age: s.number(),
  })
  .default({ name: '', age: 0 });

const personSchema = s.object({
  // ...definição do schema...
});

const storage = storageVersioning<Items>(
  {
    user: userSchema,
    person: personSchema,
  },
  { ...initialValues }, // Argumento opcional para précarregar valores
);

const unsubscribe = storage.listen(); // passa a ouvir o evento window.addEventListener('storage')
```

### Lendo dados

```ts
// Carrega todos os dados do grupo do localStorage
storage.loadAll();

// Você pode chamar individualmente também
storage.load('user');

// Retorna todos os itens (como signals)
storage.user.value;

// Retorna um item
storage.person.value;
```

### Salvando dados

```ts
storage.save('user', { name: 'John Doe', age: 30 });

// Salvando dados com expiração de 1 dia
storage.save('user', data, new Date(Date.now() + 86400000));

// Atualiza a reatividade, mas não salva no localStorage
storage.user.value = { name: 'John Doe', age: 30 };
```

### Versionamento e validação

O versionamento e validação dos dados é feito exclusivamente com a biblioteca [schemas-lib](https://github.com/Simple-Organization/schemas-lib).

```ts
import { s } from 'schemas-lib';

const personSchema = s
  .object({
    name: s.string(),
  })
  .default({ name: 'Jhon' });

const storage = storageVersioning<Items>({
  person: personSchema,
});
```

A validação com a lib ocorrerá sempre que chamar `.save` ou `load`.

É necessário usar o método `.default` do schemas-lib para dados que possam vir incorretos.

### Reatividade com signals

Essa lib usa [@preact/signals](https://preactjs.com/guide/v10/signals/) para reatividade. Cada chave definida no storageVersioning retorna um signal reativo.

---

### Tipo JSON salvo

- **data**: Dados a serem armazenados.
- **exp**: Data de expiração em milissegundos desde a época Unix.

```ts
export type StorageVersioningJSON<T> = {
  data: T;
  exp?: number;
};
```
