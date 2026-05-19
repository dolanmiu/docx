# Sections

> Every document is made up of one or more sections

A section is a grouping of paragraphs that have a specific set of properties used to define the pages on which the text will appear. Properties include page size, page numbers, page orientation, headers, borders and margins.

For example, you could have one section which is portrait with a header and footer, and another section in landscape with no footer, and a header showing the current page number.

## Basic Example

This creates a simple section in a document with one paragraph inside:

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

## Multiple Sections

Create documents with multiple sections for different layouts:

```ts
const doc = new Document({
    sections: [
        {
            // First section - portrait
            children: [new Paragraph("This is the first section in portrait.")],
        },
        {
            // Second section - landscape
            properties: {
                page: {
                    size: {
                        orientation: PageOrientation.LANDSCAPE,
                    },
                },
            },
            children: [new Paragraph("This section is in landscape orientation.")],
        },
    ],
});
```

## Section Properties

You can specify additional properties to the section by providing a `properties` attribute.

### Section Type

Setting the section type determines how the contents of the section will be placed relative to the previous section:

| Type          | Description                                    |
| ------------- | ---------------------------------------------- |
| `CONTINUOUS`  | Start on the same page as the previous section |
| `NEXT_PAGE`   | Start on a new page (default)                  |
| `EVEN_PAGE`   | Start on the next even-numbered page           |
| `ODD_PAGE`    | Start on the next odd-numbered page            |
| `NEXT_COLUMN` | Start in the next column                       |

```ts
import { SectionType } from "docx";

const doc = new Document({
    sections: [
        {
            children: [new Paragraph("First section content")],
        },
        {
            properties: {
                type: SectionType.CONTINUOUS, // Don't start new page
            },
            children: [new Paragraph("This continues on the same page")],
        },
    ],
});
```

### When to Use Each Section Type

- **CONTINUOUS**: Multi-column layouts, changing headers without page breaks
- **NEXT_PAGE**: New chapters, distinct document parts
- **EVEN_PAGE/ODD_PAGE**: Books with content starting on specific sides
- **NEXT_COLUMN**: Newsletter-style column breaks

## Common Use Cases

### Different Headers Per Section

```ts
const doc = new Document({
    sections: [
        {
            headers: {
                default: new Header({
                    children: [new Paragraph("Chapter 1")],
                }),
            },
            children: [new Paragraph("Chapter 1 content...")],
        },
        {
            headers: {
                default: new Header({
                    children: [new Paragraph("Chapter 2")],
                }),
            },
            children: [new Paragraph("Chapter 2 content...")],
        },
    ],
});
```

### Portrait and Landscape Mix

```ts
import { PageOrientation, convertMillimetersToTwip } from "docx";

const doc = new Document({
    sections: [
        {
            // Portrait section for text
            children: [new Paragraph("Introduction text...")],
        },
        {
            // Landscape section for wide table
            properties: {
                page: {
                    size: {
                        orientation: PageOrientation.LANDSCAPE,
                        width: convertMillimetersToTwip(297),
                        height: convertMillimetersToTwip(210),
                    },
                },
            },
            children: [
                new Table({
                    // Wide table that needs landscape
                    rows: [
                        /* ... */
                    ],
                }),
            ],
        },
    ],
});
```

### Multi-Column Section

```ts
const doc = new Document({
    sections: [
        {
            // Single column intro
            children: [new Paragraph("Introduction paragraph...")],
        },
        {
            // Two-column body
            properties: {
                type: SectionType.CONTINUOUS,
                column: {
                    count: 2,
                    space: 708,
                },
            },
            children: [new Paragraph("Two-column content...")],
        },
        {
            // Back to single column
            properties: {
                type: SectionType.CONTINUOUS,
            },
            children: [new Paragraph("Single column conclusion...")],
        },
    ],
});
```

## Section Properties Reference

| Property      | Type                    | Description                             |
| ------------- | ----------------------- | --------------------------------------- |
| type          | `SectionType`           | How section starts relative to previous |
| page          | `IPageSizeAttributes`   | Page size, margins, borders             |
| column        | `IColumnsAttributes`    | Multi-column configuration              |
| titlePage     | `boolean`               | Different first page header/footer      |
| lineNumbers   | `ILineNumberAttributes` | Line numbering configuration            |
| verticalAlign | `VerticalAlign`         | Vertical alignment of content           |

## Related Topics

- **[Page Layout](usage/page-layout.md)** - Page size, margins, and borders
- **[Headers & Footers](usage/headers-and-footers.md)** - Section headers and footers
- **[Columns](usage/columns.md)** - Multi-column layouts
- **[Line Numbers](usage/line-numbers.md)** - Line numbering per section

## Demos

### Multiple Sections

[Example](https://raw.githubusercontent.com/dolanmiu/docx/master/demo/16-multiple-sections.ts ":include")

_Source: https://github.com/dolanmiu/docx/blob/master/demo/16-multiple-sections.ts_

### Section Types

[Example](https://raw.githubusercontent.com/dolanmiu/docx/master/demo/58-section-types.ts ":include")

_Source: https://github.com/dolanmiu/docx/blob/master/demo/58-section-types.ts_
