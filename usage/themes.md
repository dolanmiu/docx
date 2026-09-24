# Themes

A document's theme gives it twelve colors, a font for headings and a font for body text. Word shows the theme's colors at the top of its color menus, and its fonts at the top of its font menu as "(Headings)" and "(Body)". Text and shapes that use the theme's colors and fonts change with the theme when a different one is chosen on Word's **Design** tab.

Every document `docx` writes has a theme (`word/theme/theme1.xml`): Office's theme from Office 2016 to 2021, with Calibri Light for headings and Calibri for body text, unless the `theme` option changes it.

## A theme of your own

```ts
import { Document } from "docx";

const doc = new Document({
    theme: {
        name: "Harbour",
        colors: { dark2: "1B3A4B", accent1: "1F6F8B", accent2: "E07A5F" },
        fonts: { headings: "Cambria", body: "Calibri" },
    },
    sections: [],
});
```

Colors and fonts that aren't given are Office's.

### Theme Options

| Property | Type                  | Notes    | Description                                                                             |
| -------- | --------------------- | -------- | --------------------------------------------------------------------------------------- |
| `name`   | `string`              | Optional | The theme's name, as Word shows it. Default is `"Office Theme"`                         |
| `colors` | `IThemeColorsOptions` | Optional | The theme's colors, each a 6-digit hex color such as `"4472C4"`                         |
| `fonts`  | `IThemeFontsOptions`  | Optional | `headings` and `body`: a font name, or `{ latin, eastAsia, complexScript }` for scripts |

### Theme Colors

<!-- cspell:disable -->

| Color               | OOXML name | Default                                |
| ------------------- | ---------- | -------------------------------------- |
| `dark1`             | `dk1`      | The system's window text color (black) |
| `light1`            | `lt1`      | The system's window color (white)      |
| `dark2`             | `dk2`      | `44546A`                               |
| `light2`            | `lt2`      | `E7E6E6`                               |
| `accent1`           | `accent1`  | `4472C4`                               |
| `accent2`           | `accent2`  | `ED7D31`                               |
| `accent3`           | `accent3`  | `A5A5A5`                               |
| `accent4`           | `accent4`  | `FFC000`                               |
| `accent5`           | `accent5`  | `5B9BD5`                               |
| `accent6`           | `accent6`  | `70AD47`                               |
| `hyperlink`         | `hlink`    | `0563C1`                               |
| `followedHyperlink` | `folHlink` | `954F72`                               |

<!-- cspell:enable -->

## Text in the theme's fonts

A run's or a style's `font` can be one of the theme's fonts: `{ theme: "headings" }` or `{ theme: "body" }`. It's the theme's font for every script, as Word's own styles use it.

```ts
const doc = new Document({
    theme: { fonts: { headings: "Cambria", body: "Calibri" } },
    styles: {
        default: {
            // All text is in the theme's font for body text, unless it says otherwise
            document: { run: { font: { theme: "body" }, size: 22 } },
            heading1: { run: { font: { theme: "headings" }, size: 32, color: "1B3A4B" } },
        },
    },
    sections: [
        {
            children: [
                new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun("In Cambria")] }),
                new Paragraph({
                    children: [new TextRun("In Calibri, "), new TextRun({ text: "and Cambria", font: { theme: "headings" } })],
                }),
            ],
        },
    ],
});
```

The library's own styles don't use the theme's fonts, so text looks as it always has until a style or a run asks for them. Word's styles, such as those in `externalStyles` taken from a Word document, use them: Word's `Normal` style is in the theme's font for body text, and its headings in the font for headings. The theme is the one `docx` writes, not the theme of the document the styles came from, so give that theme's fonts and colors in `theme` to keep them.

## Shapes in the theme's colors

Shapes from `docx/shapes` can be filled and outlined in the theme's colors, lighter or darker if you like, as Word's color menus offer them. See [Theme colours](usage/shapes.md#theme-colours).

```ts
import { ShapeRun } from "docx/shapes";

new ShapeRun({
    type: "roundedRectangle",
    transformation: { width: 120, height: 60 },
    fill: { theme: "accent1", lighter: 80 },
    line: { theme: "accent1", darker: 25 },
});
```

## Example

[Example](https://raw.githubusercontent.com/dolanmiu/docx/master/demo/118-theme.ts ":include")

_Source: https://github.com/dolanmiu/docx/blob/master/demo/118-theme.ts_
