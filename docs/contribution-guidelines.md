# Contribution Guidelines

## Writing Code

*   Include documentation reference(s) at the top of each file:

    ```js
    // http://officeopenxml.com/WPdocument.php
    ```

*   Follow Prettier standards, and consider using the [Prettier VSCode](https://marketplace.visualstudio.com/items?itemName=esbenp.prettier-vscode) plugin.

*   Follow the `TSLint` rules

## Add vs Create

This is just a guideline, and the rules can sometimes be broken.

*   Use `create` if the method `new`'s up an element inside:

    ```js
    public createParagraph() {
        const paragraph = new Paragraph();
        this.root.push(paragraph);
    }
    ```

*   Use `add` if you add the element into the method as a parameter:

    ```js
    public addParagraph(paragraph: Paragraph) {
        this.root.push(paragraph);
    }
    ```

## Getters and Setters

Getters and Setters are done with a capital letter like so:

```js
public get Level() {

}
```

There is no performance advantage by doing this. It means we don't need to prefix all private variables with the ugly `_`:

**Do not:** 

```js
private get _level: string;
```

**Do** 

```js
private get level: string;
```

## Testing

Please write a test of every file you make and suffix it with `.spec.ts`.

Here is a template of a test:

```js
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
