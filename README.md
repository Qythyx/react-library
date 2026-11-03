# React Library

A reusable React component and hooks library built with TypeScript, Material-UI, and i18next.

## Features

### Components

- **DataTable** - Advanced table component with sorting, pagination, grouping, and persistence. See
  [DataTable](#datatable)
- **DateField** - Date/datetime picker with validation
- **NumberField** - Numeric input with decimal support
- **ImageModal** - Full-screen image viewer
- **Thumbnail** - Image thumbnail with click-to-expand

### Hooks

- **useApiAction** - Execute API calls with error handling and loading states. See
  [Refusal reasons](#refusal-reasons)
- **useDebouncedState** - Own a value and a debounced copy of it, with configurable delay
- **useDebouncedValue** - Debounce a value owned elsewhere, such as a prop
- **useLocalStorage** - Persist state to localStorage automatically

### Utilities

- **HttpStatus** - HTTP status code enum
- **getStatusMessage** - Convert status codes to user-friendly messages
- **ApiResponse** - TypeScript types for API responses, with an optional caller-defined refusal reason

## DataTable

`DataTable` takes your records as `rows` and asks each column how to render its cell. It identifies
each row by the key `getRowKey` returns, and uses that key for the row's React key and for
`highlightedRowKeys`. `onRowClick` receives the row itself. Sorting and paging stay with you: the
table reports them to `onLoad`, and you pass back the page of rows to show.

```tsx
type OfferSortKey = 'Begins' | 'ProductName';

const columns: Column<Offer, OfferSortKey>[] = [
    {
        isSortable: true,
        key: 'ProductName',
        label: t('offers.product'),
        render: offer => offer.Product.Name,
    },
    {
        isSortable: true,
        key: 'Begins',
        label: t('offers.begins'),
        render: offer => <DateField isEditing={false} value={offer.Begins} />,
    },
];

<DataTable<Offer, OfferSortKey>
    columns={columns}
    getRowKey={offer => offer.ID}
    highlightedRowKeys={selectedOfferID === null ? [] : [selectedOfferID]}
    onLoad={loadOffers}
    onRowClick={openOffer}
    persistenceKey="offers"
    rows={offers}
    totalCount={total}
/>;
```

The second type argument names the keys `onLoad` can report as `sortBy`. It defaults to
`StringKeyOf<T>`, the record's own field names, so a table that sorts only by fields of the record
can leave it out; its `onLoad` then takes `LoadParams<StringKeyOf<T>>`. Write it when a sort key is
something the server or your own sort understands rather than a field of the record, like
`'ProductName'` above. `sortBy` is absent when no column is sortable.

`onLoad` is called again whenever it changes, so pass a new `onLoad` (for example from a
`useCallback` that depends on a filter) to reload, and a stable one otherwise. An `onLoad` written
inline in the JSX loads in an endless loop: each load sets state, which re-renders the page and
makes a new `onLoad`.

To show the rows in groups, pass `groups` instead of `rows`. Each group carries its own rows:

```tsx
<DataTable<Offer, OfferSortKey>
    columns={columns}
    getRowKey={offer => offer.ID}
    groups={suppliers.map(supplier => ({
        header: <strong>{supplier.Name}</strong>,
        key: supplier.ID,
        rows: offersBySupplier.get(supplier.ID) ?? [],
    }))}
    onLoad={loadOffers}
    persistenceKey="offers-by-supplier"
    totalCount={total}
/>
```

A column's `render` is called while the table renders, so it must not call hooks. A cell that needs
hooks goes in a component of its own, which `render` returns.

### Migrating from 4.x

Version 5 replaces the prebuilt cells with records and per-column `render` functions.

| 4.x                                               | 5.x                                                                         |
| ------------------------------------------------- | --------------------------------------------------------------------------- |
| `data: (ReactElement \| string)[][]`              | `rows: readonly T[]` and a `render` on each column                          |
| row identified by its index in `data`             | `getRowKey: (row: T) => string`                                             |
| `highlightedRows: number[]` (indexes)             | `highlightedRowKeys: string[]` (row keys)                                   |
| `groups` alongside `data`, `Group.rows: number[]` | `groups` instead of `rows`, `Group<T>.rows: T[]`                            |
| `onRowClick(rowIndex)`                            | `onRowClick(row)`                                                           |
| `Column<T>`                                       | `Column<T>`, or `Column<T, TSortKey>` for sort keys other than `T`'s fields |
| `LoadParams<T>`                                   | `LoadParams<StringKeyOf<T>>`, or `LoadParams<TSortKey>`                     |
| `SortableFields<T>`                               | removed; write the sort keys as `TSortKey`                                  |
| `sortBy` always set, to the first column          | the first sortable column, absent if none                                   |
| `persistenceKey` optional                         | `persistenceKey` required                                                   |

The table above in 4.x:

```tsx
const columns: Column<OfferRow>[] = [
    { isSortable: true, key: 'ProductName', label: t('offers.product') },
    { isSortable: true, key: 'Begins', label: t('offers.begins') },
];

const data = offers.map(offer => [
    offer.Product.Name,
    <DateField isEditing={false} value={offer.Begins} />,
]);

<DataTable<OfferRow>
    columns={columns}
    data={data}
    highlightedRows={offers.flatMap((offer, index) =>
        offer.ID === selectedOfferID ? [index] : [],
    )}
    onLoad={loadOffers}
    onRowClick={index => openOffer(offers[index]!)}
    persistenceKey="offers"
    totalCount={total}
/>;
```

The cells move into the columns, so no JSX is built in an array literal and `react/jsx-key` no
longer reports them. A row model kept only to name the sort keys, like `OfferRow` above, becomes the
`OfferSortKey` union.

## Refusal reasons

A failure that carries only `status` and an `error` string leaves a caller who must react to one
specific refusal with nothing to key on but the HTTP status — a namespace shared with every proxy and
rate limiter in between, and with the service's own unrelated failures. One endpoint can return `412`
for a stock shortage, a retry exhaustion and an ETag conflict alike.

The second type argument to `ApiResponse` names the refusals a call can report. The vocabulary is
yours; the library only carries it. A call with no refusal reasons writes `never`.

```tsx
type StockReason = 'etag-conflict' | 'out-of-stock';

const editOrder = (signal: AbortSignal): Promise<ApiResponse<Order, StockReason>> =>
    gateway.editOrder(orderId, signal);

executeAction({
    action: editOrder,
    errorMessage: <span>Could not edit the order</span>,
    failedHandler: response => {
        switch (response.reason) {
            case 'etag-conflict':
                return showReloadPrompt();
            case 'out-of-stock':
                return showStockWarning();
            case undefined:
                return;
            default: {
                const unhandled: never = response.reason;
                return unhandled;
            }
        }
    },
});
```

`response.reason` is typed as `StockReason | undefined`, so a misspelled case is a compile error. It
is optional because a call can fail without one — the `undefined` case above. The `default` arm is
what makes the switch exhaustive: assigning the reason to `never` compiles only while every member is
handled, so adding one to `StockReason` breaks the build until it is dealt with. A switch without
that arm still compiles when a member is missing.

## Development

### Building the Library

```bash
npm run build        # Build once
npm run build:watch  # Watch mode
```

### Submitting Updates

Make sure all commits include a
[Semantic Release](https://github.com/semantic-release/semantic-release) compatible description like
the following:

- Fix Release — `fix(pencil): stop graphite breaking when too much pressure applied`
- Feature Release — `feat(pencil): add 'graphiteWidth' option`
- Breaking Change (note that `BREAKING CHANGE:` must be in the footer of the comment)

    ```txt
    perf(pencil): remove graphiteWidth option

    BREAKING CHANGE: The graphiteWidth option has been removed.
    The default graphite width of 10mm is always used for performance reasons.
    ```

## Peer Dependencies

This library requires the following peer dependencies:

- React ^19.1.1
- Material-UI (MUI) ^7.3.1
- i18next ^25.4.2
- react-i18next ^15.7.3

Make sure these are installed in your consuming project.

## License

MIT
