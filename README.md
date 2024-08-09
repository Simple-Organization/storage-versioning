# storage-versioning

`storage-versioning` é uma biblioteca frontend que utiliza eventos de armazenamento do navegador (`window.storage` event) para sincronizar o `localStorage` entre diferentes abas do navegador. Isso é útil para garantir que as mudanças no armazenamento local sejam refletidas em todas as abas abertas da aplicação.

## Recursos

- Sincronização automática do `localStorage` entre abas
- Gerenciamento de versões de armazenamento local
- Expiração da chave por tempo
- Reatividade com frameworks como `Vue`, `Angular`, `SolidJS`, `PreactJS Signals`

## Instalação

Você pode instalar o `storage-versioning` via npm:

```bash
npm install storage-versioning
```

### Definindo grupo

```ts
const group = storageGroup({
  person: storageItem<typeof data>('person', 1),
  user: storageItem<any>('user'), // Versão é opcional
});
```

### Lendo dados

```ts
// Carrega todos os dados do grupo
group.load();

// Você pode chamar individualmente também
group.person.load();
```

### Salvando dados

```ts
group.person.save({ name: 'John Doe', age: 30 });

// Salvando dados com expiração de 1 dia
group.person.save(data, new Date(Date.now() + 86400000));

group.person.value = { name: 'John Doe', age: 30 }; // Não salva
```

### Configurando reatividade (signals)

Possui o método `setSignalFactory` para configurar o tipo de signal que será usado pela aplicação, podendo variar entre `Vue`, `Angular`, `SolidJS`, `PreactJS Signals`

```ts
// Vue
setSignalFactory(ref);

// Preact Signals
setSignalFactory(signal);

// Solid
setSignalFactory((initial) => {
  const [value, setValue] = createSignal(initial);

  return {
    get value() {
      return value();
    },
    set value(newValue) {
      setValue(newValue);
    },
  };
});

// Angular Signals
setSignalFactory((initial) => {
  const _signal = signal(initial);

  return {
    get value() {
      return value();
    },
    set value(newValue) {
      _signal.set(newValue);
    },
  };
});
```

### Svelte e React

Para ter reatividade pode-se usar algo como [Preact Signals in Svelte](https://svelte.dev/repl/3da10091dda341a6a7b9859450e20e9b?version=3.52.0)

E para o React [@preact/signals-react](https://www.npmjs.com/package/@preact/signals-react)

### Acessando a reatividade

```ts
// Só chamar .value
group.person.value;
```

### Testing

Para ambientes de testes automatizados, o recomendado é usar o `storageItemTesting`, a api é a mesma que o `storageItem`, porém ele não acessa o `localStorage` e também os dados não expiram, tendo maior performance nas execuções dos testes

```ts
let group = storageGroup({
  person: storageItem<typeof data>('person', 1),
  user: storageItem<any>('user'),
});

// Sobreescreve para testes
if (testing) {
  group = storageGroup({
    person: storageItemTesting<typeof data>('person', 1),
    user: storageItemTesting<any>('user'),
  });
}

// Só adiciona o window.addEventListener('storage') se não está em testes
if (!testing) {
  group.listen();
}
```

---

### Tipo JSON salvo

- **v**: Versão dos dados (string ou número).
- **data**: Dados a serem armazenados.
- **exp**: (Opcional) Data de expiração em milissegundos desde a época Unix.
  ```ts
  export type StorageVersioningJSON<T> = {
    data: T;
    v?: string | number;
    exp?: number;
  };
  ```
