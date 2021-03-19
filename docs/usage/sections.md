# Sections

> Every document is made up of one or more sections

A section is a grouping of paragraphs that have a specific set of properties used to define the pages on which the text will appear. Properties include page size, page numbers, page orientation, headers, borders and margins.

For example, you could have one section which is portrait with a header and footer, and another section in landscape with no footer, and a header showing the current page number.

## Example

This creates a simple section in a document with one paragraph inside:

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

## Properties

You can specify additional properties to the section, by providing a `properties` attribute.

### Section Type

Setting the section type determines how the contents of the section will be placed relative to the previous section. E.g., There are five different types:

-   `CONTINUOUS`
-   `EVEN_PAGE`
-   `NEXT_COLUMN`
-   `NEXT_PAGE`
-   `ODD_PAGE`

```ts
const doc = new Document({
    sections: [{
        properties: {
            type: SectionType.CONTINUOUS,
        }
        children: [
            new Paragraph({
                children: [new TextRun("Hello World")],
            }),
        ],
    }];
});
```
