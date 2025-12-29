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

- **useApiAction** - Execute API calls with error handling and loading states
- **useDebounce** - Debounce state updates with configurable delay
- **useLocalStorage** - Persist state to localStorage automatically

### Utilities

- **HttpStatus** - HTTP status code enum
- **getStatusMessage** - Convert status codes to user-friendly messages
- **ApiResponse** - TypeScript types for API responses

## Development

### Building the Library

```bash
npm run build        # Build once
npm run build:watch  # Watch mode
```

### Iterating Locally

When using as a workspace, changes to the library are immediately available in consuming projects. Just rebuild the library and your project will pick up the changes.

## Peer Dependencies

This library requires the following peer dependencies:

- React ^19.1.1
- Material-UI (MUI) ^7.3.1
- i18next ^25.4.2
- react-i18next ^15.7.3

Make sure these are installed in your consuming project.

## License

MIT
