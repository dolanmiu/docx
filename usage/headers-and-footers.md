# Headers and Footers

!> Headers and Footers requires an understanding of [Sections](usage/sections.md).

Every Section has a sections which you can define its Headers and Footers:

```ts
doc.addSection({
    headers: {
        default: new Header({ // The standard default header
            children: [],
        }),
        first: new Header({ // The first header
            children: [],
        }),
        even: new Header({ // The header on every other page
            children: [],
        }),
    },
    footers: {
        default: new Footer({ // The standard default footer
            children: [],
        }),
        first: new Footer({ // The first footer
            children: [],
        }),
        even: new Footer({ // The footer on every other page
            children: [],
        }),
    },
    children: [],
});
```

If you want more head

## Example

Example showing basic header and footer

[Example](https://raw.githubusercontent.com/dolanmiu/docx/master/demo/8-header-footer.ts ':include')

_Source: https://github.com/dolanmiu/docx/blob/master/demo/8-header-footer.ts_

## Multiple Headers and Footers

More headers and footers can be accomplished by creating more `Section`. New headers and footers can be set per `Section`
