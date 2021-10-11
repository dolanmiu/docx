# Headers and Footers

!> Headers and Footers requires an understanding of [Sections](usage/sections.md).

Every Section has a sections which you can define its Headers and Footers:

```ts
const doc = new Document({
    sections: [{
        headers: {
            default: new Header({ // The standard default header on every page or header on odd pages when the 'Different Odd & Even Pages' option is activated
                children: [],
            }),
            first: new Header({ // The header on first page when the 'Different First Page' option is activated
                children: [],
            }),
            even: new Header({ // The header on even pages when the 'Different Odd & Even Pages' option is activated
                children: [],
            }),
        },
        footers: {
            default: new Footer({ // The standard default footer on every page or footer on odd pages when the 'Different Odd & Even Pages' option is activated
                children: [],
            }),
            first: new Footer({ // The footer on first page when the 'Different First Page' option is activated
                children: [],
            }),
            even: new Footer({ // The footer on even pages when the 'Different Odd & Even Pages' option is activated
                children: [],
            }),
        },
        children: [],
    }];
});
```

## Example

Example showing basic header and footer

[Example](https://raw.githubusercontent.com/dolanmiu/docx/master/demo/8-header-footer.ts ':include')

_Source: https://github.com/dolanmiu/docx/blob/master/demo/8-header-footer.ts_

## Multiple Headers and Footers

More headers and footers can be accomplished by creating more `Section`. New headers and footers can be set per `Section`
