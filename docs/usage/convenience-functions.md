# Convenience Functions

OOXML and this library mainly uses a unit called twentieths of a point or `twip` for short. A twip is a typographical measurement, defined as 1/20 of a typographical point. One twip is 1/1440 inch, or 17.64 micrometers.

These functions help convert familiar units to twips.

More info: https://en.wikipedia.org/wiki/Twip

## Unit Conversion Functions

### Convert Inches to Twip

```ts
import { convertInchesToTwip } from "docx";

convertInchesToTwip(1); // returns 1440
convertInchesToTwip(0.5); // returns 720
convertInchesToTwip(2); // returns 2880
```

### Convert Millimeters to Twip

```ts
import { convertMillimetersToTwip } from "docx";

convertMillimetersToTwip(25.4); // returns 1440 (1 inch = 25.4mm)
convertMillimetersToTwip(50); // returns 2834
convertMillimetersToTwip(10); // returns 567
```

## Common Use Cases

### Setting Page Margins

```ts
import { Document, convertInchesToTwip } from "docx";

const doc = new Document({
    sections: [
        {
            properties: {
                page: {
                    margin: {
                        top: convertInchesToTwip(1), // 1 inch
                        right: convertInchesToTwip(1),
                        bottom: convertInchesToTwip(1),
                        left: convertInchesToTwip(1.5), // 1.5 inches for binding
                    },
                },
            },
            children: [
                /* ... */
            ],
        },
    ],
});
```

### Setting Page Size

```ts
import { Document, convertMillimetersToTwip, PageOrientation } from "docx";

// A4 paper size
const doc = new Document({
    sections: [
        {
            properties: {
                page: {
                    size: {
                        width: convertMillimetersToTwip(210), // A4 width
                        height: convertMillimetersToTwip(297), // A4 height
                        orientation: PageOrientation.PORTRAIT,
                    },
                },
            },
            children: [
                /* ... */
            ],
        },
    ],
});
```

### Column Spacing

```ts
import { Document, convertMillimetersToTwip } from "docx";

const doc = new Document({
    sections: [
        {
            properties: {
                column: {
                    count: 2,
                    space: convertMillimetersToTwip(10), // 10mm between columns
                },
            },
            children: [
                /* ... */
            ],
        },
    ],
});
```

### Table Cell Width

```ts
import { Table, TableCell, TableRow, WidthType, convertInchesToTwip } from "docx";

new Table({
    rows: [
        new TableRow({
            children: [
                new TableCell({
                    width: {
                        size: convertInchesToTwip(2), // 2 inch wide cell
                        type: WidthType.DXA,
                    },
                    children: [new Paragraph("Cell content")],
                }),
            ],
        }),
    ],
});
```

## Quick Reference

### Inches to Twips

| Inches | Twips |
| ------ | ----- |
| 0.25   | 360   |
| 0.5    | 720   |
| 0.75   | 1080  |
| 1      | 1440  |
| 1.5    | 2160  |
| 2      | 2880  |

### Millimeters to Twips (approximate)

| Millimeters | Twips |
| ----------- | ----- |
| 5           | 283   |
| 10          | 567   |
| 15          | 850   |
| 20          | 1134  |
| 25          | 1417  |
| 50          | 2834  |

## EMUs (English Metric Units)

For image positioning, OOXML uses EMUs (English Metric Units). One inch equals 914400 EMUs.

```ts
// Image offset of 1 inch
floating: {
    horizontalPosition: {
        offset: 914400,  // 1 inch in EMUs
    },
    verticalPosition: {
        offset: 914400,
    },
}
```

?> Unlike twips, there are currently no built-in conversion functions for EMUs. You can calculate them manually: `inches * 914400` or `mm * 36000`.

## Related Documentation

- [Understanding Units in OOXML](https://startbigthinksmall.wordpress.com/2010/01/04/points-inches-and-emus-measuring-units-in-office-open-xml/)
- [Document](usage/document.md) - Document-level options
- [Page Layout](usage/page-layout.md) - Page size and margins
