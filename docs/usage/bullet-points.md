# Bullet Points

!> Bullet Points require an understanding of [Paragraphs](usage/paragraph.md).

## Basic Bullet Points

Create bullet points by adding the `bullet` property to paragraphs:

```ts
const doc = new Document({
    sections: [
        {
            children: [
                new Paragraph({
                    text: "First item",
                    bullet: {
                        level: 0,
                    },
                }),
                new Paragraph({
                    text: "Second item",
                    bullet: {
                        level: 0,
                    },
                }),
                new Paragraph({
                    text: "Third item",
                    bullet: {
                        level: 0,
                    },
                }),
            ],
        },
    ],
});
```

### Output:

- First item
- Second item
- Third item

## Multi-Level Lists

Create nested lists using different `level` values (0-9):

```ts
const doc = new Document({
    sections: [
        {
            children: [
                new Paragraph({
                    text: "Main item 1",
                    bullet: { level: 0 },
                }),
                new Paragraph({
                    text: "Sub-item 1.1",
                    bullet: { level: 1 },
                }),
                new Paragraph({
                    text: "Sub-item 1.2",
                    bullet: { level: 1 },
                }),
                new Paragraph({
                    text: "Deep item 1.2.1",
                    bullet: { level: 2 },
                }),
                new Paragraph({
                    text: "Main item 2",
                    bullet: { level: 0 },
                }),
            ],
        },
    ],
});
```

### Output:

- Main item 1
    - Sub-item 1.1
    - Sub-item 1.2
        - Deep item 1.2.1
- Main item 2

## Bullet Options

| Property | Type     | Notes    | Description             |
| -------- | -------- | -------- | ----------------------- |
| level    | `number` | Required | Indentation level (0-9) |

## Programmatic List Generation

Generate bullet lists from data:

```ts
const items = ["Apple", "Banana", "Cherry", "Date"];

const doc = new Document({
    sections: [
        {
            children: items.map(
                (item) =>
                    new Paragraph({
                        text: item,
                        bullet: { level: 0 },
                    }),
            ),
        },
    ],
});
```

## Nested Data Structures

Create hierarchical lists from nested data:

```ts
interface MenuItem {
    name: string;
    children?: MenuItem[];
}

const menu: MenuItem[] = [
    {
        name: "Fruits",
        children: [{ name: "Apple" }, { name: "Orange" }],
    },
    {
        name: "Vegetables",
        children: [{ name: "Carrot" }, { name: "Broccoli" }],
    },
];

function createBulletItems(items: MenuItem[], level: number = 0): Paragraph[] {
    const paragraphs: Paragraph[] = [];

    for (const item of items) {
        paragraphs.push(
            new Paragraph({
                text: item.name,
                bullet: { level },
            }),
        );

        if (item.children) {
            paragraphs.push(...createBulletItems(item.children, level + 1));
        }
    }

    return paragraphs;
}

const doc = new Document({
    sections: [
        {
            children: createBulletItems(menu),
        },
    ],
});
```

## Mixing Bullets with Other Content

Combine bullet points with regular paragraphs:

```ts
const doc = new Document({
    sections: [
        {
            children: [
                new Paragraph({
                    text: "Shopping List",
                    heading: HeadingLevel.HEADING_1,
                }),
                new Paragraph("Items to buy:"),
                new Paragraph({
                    text: "Milk",
                    bullet: { level: 0 },
                }),
                new Paragraph({
                    text: "Bread",
                    bullet: { level: 0 },
                }),
                new Paragraph({
                    text: "Eggs",
                    bullet: { level: 0 },
                }),
                new Paragraph("Remember to check expiration dates!"),
            ],
        },
    ],
});
```

## Styled Bullet Items

Apply text formatting to bullet items:

```ts
new Paragraph({
    bullet: { level: 0 },
    children: [new TextRun({ text: "Important: ", bold: true }), new TextRun("This item requires attention")],
});
```

## Related Topics

- **[Numbering](usage/numbering.md)** - For numbered lists with custom formats
- **[Paragraph](usage/paragraph.md)** - For paragraph formatting options
- **[Styling with JS](usage/styling-with-js.md)** - For custom bullet styles

## Demo

[Example](https://raw.githubusercontent.com/dolanmiu/docx/master/demo/3-numbering-and-bullet-points.ts ":include")

_Source: https://github.com/dolanmiu/docx/blob/master/demo/3-numbering-and-bullet-points.ts_
