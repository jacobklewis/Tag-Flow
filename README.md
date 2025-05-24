# Tag Flow

Tag Flow is a simple and resilient HTML parser designed to streamline and enhance your web development workflow. This repository provides tools, utilities, and best practices to help developers efficiently parse and manipulate HTML content.

## Features

- **Resilient Parsing**: Handles malformed or complex HTML gracefully.
- **Streamlined Workflow**: Simplifies HTML parsing and manipulation tasks.
  - Query
  - Edit Elements
  - Edit Attributes
  - Edit Inner HTML
  - Edit Tag Names
- **Bidirectional Parsing**: Transform from and to HTML

## Installation

To install, use npm:

```bash
npm install tag-flow
```

## Usage

### Parse an HTML string:

```typescript
import { flow } from 'tag-flow'
const htmlContent = '<div><h1>Hello</h1> World!</div>';
const fl = flow(htmlContent);
console.log(fl.q("h1").html)
```
```html
<h1>Hello</h1>
```
```typescript
fl.q("h1").setName("h3")
fl.save("new.html");
```
```html
<div><h3>Hello</h3> World!</div>
```

### Query by:
* Tag name
  ```ts
  fl.q("div")
  ```
* Class
  ```ts
  fl.q(".className")
  ```
* ID
  ```ts
  fl.q("#myId")
  ```
* Inner HTML
  ```ts
  // Returns tags containing this text
  fl.q("*Hello")
  ```

### Edit Elements
```ts
// Add Element to .content
fl.q(".content").addElement({type: "text",text: "Hello World"} as TFText);
// Remove Element from .content
fl.q(".content").remove(0);
// Remove .content
fl.q(".content").remove();
// Remove all children of .content
fl.q(".content").innerHTML = "";
// or
fl.q(".content").removeChildren();
```

### Edit Attributes
```ts
// Add href attribute to all `a` tags
fl.q("a").attr("href", "https://google.com");
// Remove an attribute
fl.q("a").delAttr("href");
```

### Edit Inner HTML
```ts
// Add inner HTML to query result
fl.q(".content").innerHTML = "<h1>Good Morning</h1>";
// or
fl.q(".content").setInnerHTML("<h1>Good Morning</h1>");
// Get the raw inner HTML as a string
console.log(fl.q(".content").innerHTML);
```

### Edit Tag Names
```ts
// Change all `h1` to `h2`
const htmlContent = '<div><h1>Hello</h1> World!</div>';
const fl = flow(htmlContent);
fl.q("h1").name = "h2";
// or
fl.q("h1").setName("h2");
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
3. Make your changes.
4. Verify your changes don't break existing tests or change them appropriately. Add tests where appropriate.
5. Commit your changes (`git commit -m 'Add feature'`).
6. Push to the branch (`git push origin feature-name`).
7. Open a pull request.

## License

This project is licensed under the [MIT License](LICENSE).

## Contact

For questions or feedback, feel free to reach out to the project maintainer at `contact@jacoblewis.me`.
