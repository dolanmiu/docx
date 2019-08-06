# Contribution Guidelines

*   Include documentation reference(s) at the top of each file:

    ```ts
    // http://officeopenxml.com/WPdocument.php
    ```

*   Follow Prettier standards, and consider using the [Prettier VSCode](https://marketplace.visualstudio.com/items?itemName=esbenp.prettier-vscode) plugin.

*   Follow the `TSLint` rules

## Always think about the user

The number one pillar for contribution to `docx` is to **ALWAYS** think about how the user will use `docx`.

Put yourself in their position, and imagine how they would feel about your feature you wrote.

1. Is it easy to use?
2. Has it been documented well?
3. Is it intuitive?
4. Is it consistent with the rest of the API?
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

## No leaky components in API interface

> This mainly applies to the API the end user will consume.

Try to make method parameters of the outside API accept primitives, or `json` objects, so that child components are created **inside** the component, rather than being **injected** in.

This is so that:

1. Imports are much cleaner for the end user, no need for:
   ```ts
   import { ChildComponent } from "./my-feature/sub-component/deeper/.../my-deep.component";
   ```

2. This is what I consider "leakage". The code is aware of the underlying implementation of the component.
3. It means the end user does not need to import and create the child component to be injected.

**Do not**

`TableFloatProperties` is a class. The outside world would have to `new` up the object, and inject it in like so:

```ts
    public float(tableFloatProperties: TableFloatProperties): Table
```

```ts
    table.float(new TableFloatProperties(...));
```

**Do**

`ITableFloatOptions` is an interface for a JSON of primitives. The end user would need to pass in a json object and not need to worry about the internals:

```ts
    public float(tableFloatOptions: ITableFloatOptions): Table
```

```ts
    table.float({...});
```

## Add vs Create

This is just a guideline, and the rules can sometimes be broken.

*   Use `create` if the method `new`'s up an element inside:

    ```ts
    public createParagraph() {
        const paragraph = new Paragraph();
        this.root.push(paragraph);
    }
    ```

*   Use `add` if you add the element into the method as a parameter.
    *Note:* This may look like its breaking the previous guideline, but it has semantically different meanings. The previous one is using data to construct an object, whereas this one is simply adding elements into the document:

    ```ts
    public add(paragraph: Paragraph) {
        this.root.push(paragraph);
    }
    ```

## Getters and Setters

Getters and Setters are done with a capital letter like so:

```ts
public get Level() {
   ...
}
```

There is no performance advantage by doing this. It means we don't need to prefix all private variables with the ugly `_`:

**Do not:**

```ts
private get _level: string;
```

**Do**

```ts
private get level: string;
```

## Temporal Methods

Some methods  are `non-temporal`, which means regardless of when you call the method, it will have the same affect on the document. For example, setting the width of a table at the end of the document will have the same effect as setting the width at the start:

```ts
table.setWidth(1000); // now removed as of version 5.0.0
```

Whereas some methods are `temporal`, which means depending on the time-frame they are called, it would produce a difference result. For example, moving `createParagraph()` around your code will physically alter the document.

```ts
doc.createParagraph("hello");
```

If a method is `non-temporal`, put it in the objects `constructor`. For example:

```ts
const table = new Table(width: number);
```

`Non-temporal` methods are usually methods which can only be used one time and one time only. For example, `.float()`. It does not make sense to call `.float()` again if its already floating.

I am not sure what the real term is, but this will do.

## Interfaces over type alias

Do not use `type`, but rather use `Interfaces`. `type` cannot be extended, and a class cannot implement it.

> "In general, use what you want ( type alias / interface ) just be consistent"
> "always use interface for public API's definition when authoring a library or 3rd party ambient type definitions"
>
> *   https://medium.com/@martin_hotell/interface-vs-type-alias-in-typescript-2-7-2a8f1777af4c

`Interface` is generally preferred over `type`: https://stackoverflow.com/questions/37233735/typescript-interfaces-vs-types

**Do not:**

```ts
type RelationshipFileInfo = { id: number, target: string };
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

I am not sure where these habits in software development come from, but I do not believe it is beneficial:

**Do not:**
```ts
readdy // misspelling
perm // abbreviation
conf // abbreviation
cnty // abbreviation
relationFile // abbreviation
colour // U.K. English
```

**Do:**
```ts
ready
permission
config
country
relationshipFile
color
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
