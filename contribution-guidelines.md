# Contribution Guidelines

- Include documentation reference(s) at the top of each file as a comment. For example:

    ```ts
    // http://officeopenxml.com/WPdocument.php
    ```

    <!-- cSpell:ignore datypic -->

    It can be a link to `officeopenxml.com` or `datypic.com` etc.
    It could also be a reference to the official ECMA-376 standard: https://www.ecma-international.org/publications-and-standards/standards/ecma-376/

- Include a portion of the schema as a comment for cross reference. For example:

    ```ts
    // <xsd:element name="tbl" type="CT_Tbl" minOccurs="0" maxOccurs="1"/>
    ```

- Follow Prettier standards, and consider using the [Prettier VSCode](https://marketplace.visualstudio.com/items?itemName=esbenp.prettier-vscode) plugin.

- Follow the `ESLint` rules

## Always think about the user

Put yourself in their position, and imagine how they would feel about the feature you wrote.

1. Is it easy to use?
2. Has it been documented well?
3. Is it intuitive?
4. Is it declarative?
5. Is it fun to use?

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

Make sure the API is declarative, so no _method calling_ or _mutation_. This is a design decision, consistent with the rest of the project. There are benefits to declarative code over other styles of code, explained here: https://dzone.com/articles/why-declarative-coding-makes-you-a-better-programm

**Do not:**

```ts
const paragraph = doc.createParagraph();
const text = paragraph.createText();
text.contents = "Hello World";
```

**Do**

```ts
const doc = new Document({
    sections: [{
        children: [
            new Paragraph({
                children: [new TextRun("Hello World")],
            }),
        ],
    }];
});
```

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

Try not to use the `tests/utility.ts` file as this is being deprecated.
