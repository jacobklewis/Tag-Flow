# Tag Flow

Tag Flow is a simple and resilient HTML parser designed to streamline and enhance your web development workflow. This repository provides tools, utilities, and best practices to help developers efficiently parse and manipulate HTML content.

## Features

- **Resilient Parsing**: Handles malformed or complex HTML gracefully.
- **Streamlined Workflow**: Simplifies HTML parsing and manipulation tasks.
- **Extensibility**: Easily extend and customize for your specific needs.

## Installation

To install, use npm:

```bash
npm install tag-flow
```

## Usage

Parse an HTML string:

```typescript
import { flow } from 'tag-flow'
const htmlContent = '<div><h1>Hello</h1> World!</div>';
const parsed = flow(htmlContent);
console.log(parsed.q("h1"))
```
```bash
<h1>Hello</h1>
```

## Download and Modify

1. Clone or Fork Repo
2. `npm install`
3. Run tests:

```bash
npm test
```

## Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository.
2. Create a new branch (`git checkout -b feature-name`).
3. Commit your changes (`git commit -m 'Add feature'`).
4. Push to the branch (`git push origin feature-name`).
5. Open a pull request.

## License

This project is licensed under the [MIT License](LICENSE).

## Contact

For questions or feedback, feel free to reach out to the project maintainer at `contact@jacoblewis.me`.
