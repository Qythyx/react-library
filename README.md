# React Library

A reusable React component and hooks library built with TypeScript, Material-UI, and i18next.

## Features

### Components

- **DataTable** - Advanced table component with sorting, pagination, grouping, and persistence
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
