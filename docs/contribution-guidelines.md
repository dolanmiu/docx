# Contribution Guidelines

-   Include documentation reference(s) at the top of each file:

    ```ts
    // http://officeopenxml.com/WPdocument.php
    ```

-   Follow Prettier standards, and consider using the [Prettier VSCode](https://marketplace.visualstudio.com/items?itemName=esbenp.prettier-vscode) plugin.

-   Follow the `TSLint` rules

## Always think about the user

Put yourself in their position, and imagine how they would feel about your feature you wrote.

1. Is it easy to use?
2. Has it been documented well?
3. Is it intuitive?
4. Is it declarative?
5. Is it fun to use?

## Good Commit Names

Please write good commit messages when making a commit: https://chris.beams.io/posts/git-commit/

**Do not:**

```
c // What?
rtl // Adding acryonyms without explaining anything else is not helpful
works! // Glad its working, but the message is not helpful
demo updated // Getting better, but capitalize the first letter
Unesesary coment removed // Make sure to use correct spelling
```

**Do**

`ITableFloatOptions` is an interface for a JSON of primitives. The end user would need to pass in a json object and not need to worry about the internals:

```ts
    public float(tableFloatOptions: ITableFloatOptions): Table
```

## Delcariative API

Make sure the API is declarative, so no _method calling_ or _mutation_. This is a design decision, consistent with the rest of the project. There are benefits to delcariative code over other styles of code, explained here: https://dzone.com/articles/why-declarative-coding-makes-you-a-better-programm

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

## Interfaces over type alias

Do not use `type`, but rather use `Interfaces`. `type` cannot be extended, and a class cannot implement it.

> "In general, use what you want ( type alias / interface ) just be consistent"
> "always use interface for public API's definition when authoring a library or 3rd party ambient type definitions"
>
> -   https://medium.com/@martin_hotell/interface-vs-type-alias-in-typescript-2-7-2a8f1777af4c

`Interface` is generally preferred over `type`: https://stackoverflow.com/questions/37233735/typescript-interfaces-vs-types

**Do not:**

```ts
type RelationshipFileInfo = { id: number; target: string };
```

**Do:**

```ts
interface IRelationshipFileInfo {
    id: number;
    target: string;
}
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
import { assert } from "chai";

describe("ClassName", () => {
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
