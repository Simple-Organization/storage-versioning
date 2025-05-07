# storage-versioning

`storage-versioning` é uma biblioteca frontend que utiliza eventos de armazenamento do navegador (`window.storage` event) para sincronizar o `localStorage` entre diferentes abas do navegador. Isso é útil para garantir que as mudanças no armazenamento local sejam refletidas em todas as abas abertas da aplicação.

## Recursos

- Sincronização automática do `localStorage` entre abas
- Gerenciamento de versões de `localStorage` com versão ou `schemas` (como Zod)
- Expiração da chave por tempo
- Reatividade com signals usando [simorg-store](https://github.com/Simple-Organization/simorg-store#readme)

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
export type Items = {
  user: LoggedUser;
  person: PersonObject;
};

const storage = storageVersioning<Items>(
  {
    user: 1, // Versão guardada
    person: (data) => doSomeValidation(data),
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

// Retorna todos os itens
storage.get();

// Retorna um item
storage.get('user');
```

### Salvando dados

```ts
storage.save('user', { name: 'John Doe', age: 30 });

// Salvando dados com expiração de 1 dia
storage.save('user', data, new Date(Date.now() + 86400000));

// Atualiza a reatividade, mas não salva no localStorage
storage.set({ name: 'John Doe', age: 30 });
```

### Versionamento e validação

Você pode controlar um item pela versão dele, ou por um schema como do [Zod](https://zod.dev/) ou [Yup](https://github.com/jquense/yup)

```ts
// Com versionamento por string ou number
const storage = storageVersioning<Items>({
  user: 1,
  person: 'v3.0',
});

// Com lib como zod
const schema = z
  .object({
    name: z.string(),
  })
  .catch({ name: 'Jhon' });

const storage = storageVersioning<Items>({
  person: (data) => schema.parse(data),
});
```

A validação com a lib ocorrerá sempre que chamar `.save` ou `load`

É recomendado usar recurso como `.catch` do zod para dados que possam vir incorretos

### Configurando reatividade (signals)

Essa lib usa [simorg-store](https://github.com/Simple-Organization/simorg-store#readme) para configurar a reatividade entre `React`, `Preact`. `Svelte`, `Vue`, `Solid`, leia mais no repositório do `simorg-store`

---

### Tipo JSON salvo

- **v**: Versão dos dados (string ou número).
- **data**: Dados a serem armazenados.
- **exp**: Data de expiração em milissegundos desde a época Unix.

```ts
export type StorageVersioningJSON<T> = {
  data: T;
  v?: string | number;
  exp?: number;
};
```
