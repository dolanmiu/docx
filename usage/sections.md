# Sections

> Every document is made up of one or more sections

A section is a grouping of paragraphs that have a specific set of properties used to define the pages on which the text will appear. Properties include page size, page numbers, page orientation, headers, borders and margins.

For example, you could have one section which is portrait with a header and footer, and another section in landscape with no footer, and a header showing the current page number.

## Example

This creates a simple section in a document with one paragraph inside:

```ts
doc.addSection({
    children: [
        new Paragraph({
            children: [new TextRun("Hello World")],
        }),
    ],
});
```
