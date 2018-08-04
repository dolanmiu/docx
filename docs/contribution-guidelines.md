# Contribution Guidelines

## Writing Code

*   Include documentation reference(s) at the top of each file:

    ```js
    // http://officeopenxml.com/WPdocument.php
    ```

*   Follow Prettier standards, and consider using the [Prettier VSCode](https://marketplace.visualstudio.com/items?itemName=esbenp.prettier-vscode) plugin.

*   Follow the `TSLint` rules

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
