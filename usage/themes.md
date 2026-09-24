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

## Text, tables and borders in the theme's colors

Wherever text, underlines, borders and shading take a color, they can take one of the theme's colors instead: `{ theme: "accent1" }`. They change color when the theme's colors change.

`lighter` and `darker` make the color lighter or darker, from 0 (unchanged) to 100 (white or black), as Word's color menus do: "Blue, Accent 1, Lighter 80%" is `{ theme: "accent1", lighter: 80 }`, and "Blue, Accent 1, Darker 25%" is `{ theme: "accent1", darker: 25 }`.

```ts
const doc = new Document({
    theme: { colors: { accent1: "1F6F8B" } },
    styles: {
        default: {
            heading1: { run: { color: { theme: "accent1", darker: 25 } } },
        },
    },
    sections: [
        {
            children: [
                new Paragraph({
                    // A rule under the paragraph, and a light background
                    border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: { theme: "accent1" } } },
                    shading: { type: ShadingType.CLEAR, fill: { theme: "accent1", lighter: 80 } },
                    children: [
                        new TextRun({ text: "Accent text", color: { theme: "accent1" } }),
                        new TextRun({
                            text: " with a wavy underline",
                            underline: { type: UnderlineType.WAVE, color: { theme: "accent2" } },
                        }),
                    ],
                }),
            ],
        },
    ],
});
```

| Option                                                                                | Takes a theme color |
| ------------------------------------------------------------------------------------- | ------------------- |
| A run's or style's `color`                                                            | `color`             |
| A run's or style's `underline`                                                        | `underline.color`   |
| `shading` of runs, paragraphs, tables and table cells                                 | `fill` and `color`  |
| A run's `border`, and each side of the borders of paragraphs, tables, cells and pages | `color`             |
| `Document`'s `background`, the color of the page                                      | `color`             |

The theme's color names are those in [Theme Colors](#theme-colors). Word's color menus call `dark1` and `light1` "Text 1" and "Background 1", and `dark2` and `light2` "Text 2" and "Background 2".

Word writes a theme color with the color it comes to, for applications that don't read the theme, and so does `docx`: `{ theme: "accent1", darker: 25 }` in Office's theme is written as `2F5496`, the color Word writes for "Blue, Accent 1, Darker 25%". For some colors, the color `docx` writes is one or two off Word's in a channel. With [`patchDocument`](usage/patcher.md), that color is worked out from the template's theme, or from Office's if the template has none. Word takes the color from the theme either way.

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

## Examples

### A theme of its own

[Example](https://raw.githubusercontent.com/dolanmiu/docx/master/demo/118-theme.ts ":include")

_Source: https://github.com/dolanmiu/docx/blob/master/demo/118-theme.ts_

### Text, tables and borders in the theme's colors

[Example](https://raw.githubusercontent.com/dolanmiu/docx/master/demo/119-theme-colors.ts ":include")

_Source: https://github.com/dolanmiu/docx/blob/master/demo/119-theme-colors.ts_
