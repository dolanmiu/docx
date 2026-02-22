# Contribution Guidelines

## File Documentation

Every source file must include structured JSDoc documentation. This ensures discoverability and traceability back to the OOXML specification.

### Module-Level JSDoc

Each file should begin with a module-level JSDoc block containing:

1. A brief description of the module's purpose.
2. A `Reference:` link to the relevant documentation (e.g., [officeopenxml.com](http://officeopenxml.com), [datypic.com](http://www.datypic.com/sc/ooxml/), or the [ECMA-376 standard](https://www.ecma-international.org/publications-and-standards/standards/ecma-376/)).
3. The `@module` tag.

```ts
/**
 * Header module for WordprocessingML documents.
 *
 * Headers are repeated at the top of each page in a section.
 *
 * Reference: http://officeopenxml.com/WPheaders.php
 *
 * @module
 */
```

### XSD Schema References

Include the relevant XSD schema fragment in a `## XSD Schema` section within the JSDoc of classes and factory functions. The `ooxml-schemas/` directory in this repository contains the official ISO-IEC29500 OOXML XSD schemas and serves as the **golden source of truth**.

Key schemas:

| Schema                                              | Purpose                                    |
| --------------------------------------------------- | ------------------------------------------ |
| `ooxml-schemas/ISO-IEC29500-4_2016/wml.xsd`         | WordprocessingML (main document structure) |
| `ooxml-schemas/ISO-IEC29500-4_2016/dml-main.xsd`    | DrawingML (images, shapes)                 |
| `ooxml-schemas/ISO-IEC29500-4_2016/shared-math.xsd` | Math equations                             |
| `ooxml-schemas/ISO-IEC29500-4_2016/vml-main.xsd`    | VML (legacy shapes, textboxes)             |

Always cross-reference these schemas when implementing or modifying XML generation:

````ts
/**
 * Represents a table in a WordprocessingML document.
 *
 * Reference: http://officeopenxml.com/WPtable.php
 *
 * @publicApi
 *
 * ## XSD Schema
 * ```xml
 * <xsd:complexType name="CT_Tbl">
 *   <xsd:sequence>
 *     <xsd:group ref="EG_RangeMarkupElements" minOccurs="0" maxOccurs="unbounded"/>
 *     <xsd:element name="tblPr" type="CT_TblPr"/>
 *     <xsd:element name="tblGrid" type="CT_TblGrid"/>
 *     <xsd:group ref="EG_ContentRowContent" minOccurs="0" maxOccurs="unbounded"/>
 *   </xsd:sequence>
 * </xsd:complexType>
 * ```
 */
````

### Code Style and Linting

- Follow Prettier formatting standards. Consider using the [Prettier VS Code extension](https://marketplace.visualstudio.com/items?itemName=esbenp.prettier-vscode).
- Follow all `ESLint` rules configured in the project.

## API Design Principles

Every feature should be designed from the consumer's perspective. Before submitting a contribution, verify that your API meets the following criteria:

1. **Ease of use** — Can a developer use this feature with minimal friction?
2. **Documentation** — Are the options, behavior, and examples clearly documented in JSDoc?
3. **Intuitiveness** — Does the API behave as a developer would reasonably expect?
4. **Declarative style** — Does it follow the project's declarative construction pattern?
5. **Developer experience** — Is it pleasant to read and write?

## Good Commit Names

Please write good commit messages when making a commit: https://chris.beams.io/posts/git-commit/

**Do not:**

<!-- cspell:disable -->

```
c // What?
rtl // Adding acronyms without explaining anything else is not helpful
works! // Glad its working, but the message is not helpful
demo updated // Getting better, but capitalize the first letter
Unesesary coment removed // Make sure to use correct spelling
```

<!-- cspell:enable -->

**Do**

`ITableFloatOptions` is an interface for a JSON of primitives. The end user would need to pass in a json object and not need to worry about the internals:

```ts
    public float(tableFloatOptions: ITableFloatOptions): Table
```

## Declarative API

All APIs must be **declarative** — no method chaining, mutation, or imperative construction patterns. This is a core design principle of the project. See: https://dzone.com/articles/why-declarative-coding-makes-you-a-better-programm

**Do not:**

```ts
const paragraph = doc.createParagraph();
const text = paragraph.createText();
text.contents = "Hello World";
```

**Do:**

```ts
const doc = new Document({
    sections: [
        {
            children: [
                new Paragraph({
                    children: [new TextRun("Hello World")],
                }),
            ],
        },
    ],
});
```

### Public API Elements (`@publicApi`)

User-facing elements (e.g., `Document`, `Paragraph`, `Table`, `TextRun`, `Textbox`) use the `new ClassName(options)` pattern and must be annotated with `@publicApi` in their JSDoc. These form the idiomatic surface of the library that end-users interact with:

```ts
/**
 * @publicApi
 */
export class Textbox extends FileChild {
    public constructor({ style, children, ...rest }: ITextboxOptions) {
        // ...
    }
}
```

### Internal Elements (`BuilderElement`)

For internal XML construction — elements that are not part of the public API — use `BuilderElement` or `createXyz()` factory functions. This is less verbose while keeping the declarative style intact:

```ts
export const createVerticalAlign = (value: VerticalAlignValue): XmlComponent =>
    new BuilderElement<{ readonly verticalAlign: VerticalAlignValue }>({
        name: "w:vAlign",
        attributes: {
            verticalAlign: { key: "w:val", value },
        },
    });
```

`BuilderElement` provides typed attributes and optional children in a single declarative call, removing the need for boilerplate wrapper classes for simple XML elements.

## Getters and Setters

Getters and Setters are done with a capital letter like so:

```ts
public get Level() {
   ...
}
```

This is the convention of this project. There is no performance advantage by doing this. It means we don't need to prefix all private variables with `_`:

**Do not:**

```ts
private get _level: string;
```

**Do**

```ts
private get level: string;
```

## Types over interfaces

Using `type` aliases in TypeScript offers several advantages over `interfaces`:

- **Flexibility with Complex Types**: `type` supports defining unions, intersections, and other complex type constructs that `interfaces` cannot handle. For example:

    ```typescript
    type StringOrNumber = string | number;
    type Combined = TypeA & TypeB;
    ```

- **Support for Primitive Types**: `type` can alias primitive types (e.g., `type ID = string`), while `interfaces` are limited to object shapes.
- **Tuple and Array Types**: `type` allows defining tuples and specific array types easily (e.g., `type Point = [number, number]`), which `interfaces` cannot represent.
- **Utility Types Compatibility**: `type` works seamlessly with TypeScript's utility types (e.g., `Partial<T>`, `Pick<T, K>`), enabling more expressive type transformations.
- **Functional Programming**: `type` is ideal for functional programming patterns, such as defining function signatures or mapped types, due to its versatility.
- **No Declaration Merging**: Unlike `interfaces`, type does not support declaration merging, which can prevent accidental type extensions and ensure predictable type definitions.
- **Consistent Pattern**: This project uses `type` for all type definitions, so using `type` for all type definitions maintains consistency and readability across the codebase.

Detailed discussion: https://stackoverflow.com/questions/37233735/typescript-interfaces-vs-types

**Do not:**

```ts
interface IRelationshipFileInfo {
    id: number;
    target: string;
}
```

**Do:**

```ts
type RelationshipFileInfo = { id: number; target: string };
```

## String enums vs type

To take full advantage of TypeScript's typing system, its best to use `string enums`:

**Do not:**

```ts
type WeaponType = "bow" | "sword" | "wand";
```

**Do:**

```ts
enum WeaponType = {
    BOW = "bow",
    SWORD = "sword",
    WAND = "wand",
}
```

## Spell correctly, in full and in American English

**Do not:**

```ts
readdy; // misspelling
perm; // abbreviation
conf; // abbreviation
cnty; // abbreviation
relationFile; // abbreviation
colour; // U.K. English
```

**Do:**

```ts
ready;
permission;
config;
country;
relationshipFile;
color;
```

## Keep files small (within reason)

To minimize merge conflicts, reduce complexity, and improve readability, keep the files small.

## Name files and folders with `/foo-bar/kebab-case.ts`

To be consistent and in-line with the project, name files `like-this.ts`.

https://stackoverflow.com/questions/7273316/what-is-the-javascript-filename-naming-convention

## Testing

Please write a test of every file you make and suffix it with `.spec.ts`.

Here is a template of a test:

```ts
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

describe("ClassName", () => {
    afterEach(() => {
        // TODO
    });

    beforeEach(() => {
        // TODO
    });

    describe("#methodName()", () => {
        it("should ", () => {
            // TODO
        });
    });
});
```
