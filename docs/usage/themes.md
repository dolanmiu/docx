# Themes

A document's theme gives it twelve colors, a font for headings and a font for body text. Word shows the theme's colors at the top of its color menus, and its fonts at the top of its font menu as "(Headings)" and "(Body)". Text and shapes that use the theme's colors and fonts change with the theme when a different one is chosen on Word's **Design** tab.

Every document `docx` writes has a theme (`word/theme/theme1.xml`): Office's theme from Office 2016 to 2021, with Calibri Light for headings and Calibri for body text, unless the `theme` option changes it.

Word's own themes, colors and fonts, as its **Design** tab offers them, and a reader for the theme of a Word document or template, come with the `docx` package, from `docx/theme`:

```ts
import { ColorSchemes, FontSchemes, Themes, readTheme } from "docx/theme";
```

In a page without a bundler, load `dist/theme.umd.cjs` after `dist/index.umd.cjs` (or `dist/theme.iife.js` after `dist/index.iife.js`). It adds a `docxTheme` global, such as `docxTheme.Themes.FACET`.

## A theme of your own

```ts live
import { Document, Paragraph, TextRun } from "docx";

const doc = new Document({
    theme: {
        name: "Harbour",
        colors: { dark2: "1B3A4B", accent1: "1F6F8B", accent2: "E07A5F" },
        fonts: { headings: "Cambria", body: "Calibri" },
    },
    sections: [
        {
            children: [
                new Paragraph({
                    children: [
                        new TextRun({
                            text: "In the theme's font for headings, and accent 1",
                            font: { theme: "headings" },
                            color: { theme: "accent1" },
                        }),
                    ],
                }),
                new Paragraph({
                    children: [
                        new TextRun({
                            text: "In the theme's font for body text, and accent 2",
                            font: { theme: "body" },
                            color: { theme: "accent2" },
                        }),
                    ],
                }),
            ],
        },
    ],
});
```

Colors and fonts that aren't given are Office's.

### Theme Options

| Property | Type                  | Notes    | Description                                                                                                                                                     |
| -------- | --------------------- | -------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `name`   | `string`              | Optional | The theme's name, as Word shows it. Default is `"Office Theme"`                                                                                                 |
| `colors` | `IThemeColorsOptions` | Optional | The theme's colors, each a 6-digit hex color such as `"4472C4"`                                                                                                 |
| `fonts`  | `IThemeFontsOptions`  | Optional | `headings` and `body`: a font name, or `{ latin, eastAsia, complexScript, scripts }` for other scripts. See [Fonts for other scripts](#fonts-for-other-scripts) |

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

### Fonts for other scripts

Each of the theme's fonts can have a font for East Asian text (`eastAsia`), a font for complex scripts such as Arabic and Hebrew (`complexScript`), and a font for each script of its own (`scripts`), by the script's [ISO 15924](https://en.wikipedia.org/wiki/ISO_15924) code, such as `Jpan` for Japanese, `Hans` for simplified Chinese or `Arab` for Arabic. Word uses them for text in those scripts that is in the theme's fonts.

The fonts given in `scripts` take the place of Office's for those scripts, and Office's are kept for the others, as Office's theme has a font for each of about fifty scripts.

```ts live
import { Document, Paragraph, TextRun } from "docx";

const doc = new Document({
    theme: {
        fonts: {
            headings: { latin: "Georgia", scripts: { Jpan: "Yu Mincho" } },
            body: { latin: "Verdana", scripts: { Jpan: "Meiryo", Arab: "Tahoma" } },
        },
    },
    sections: [
        {
            children: [
                new Paragraph({ children: [new TextRun({ text: "Body text, 本文", font: { theme: "body" } })] }),
                new Paragraph({ children: [new TextRun({ text: "A heading, 見出し", font: { theme: "headings" } })] }),
            ],
        },
    ],
});
```

## Word's themes

`Themes` has each of the themes of Word's **Design > Themes** gallery, with its name, its colors, and its fonts for headings and body text, as Word has them. Give one to `theme`:

```ts live
import { Document, HeadingLevel, Paragraph, ShadingType, Table, TableCell, TableRow, TextRun, WidthType } from "docx";
import { Themes } from "docx/theme";

const accents = ["accent1", "accent2", "accent3", "accent4", "accent5", "accent6"] as const;

const doc = new Document({
    // Try another of Word's themes, such as Themes.ION or Themes.WOOD_TYPE
    theme: Themes.FACET,
    styles: {
        default: {
            document: { run: { font: { theme: "body" }, size: 22 } },
            heading1: { run: { font: { theme: "headings" }, size: 36, color: { theme: "accent1", darker: 25 } } },
        },
    },
    sections: [
        {
            children: [
                new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun("A heading in the theme's font")] }),
                new Paragraph("Body text in the theme's font for body text, above the theme's six accent colors."),
                new Table({
                    width: { size: 100, type: WidthType.PERCENTAGE },
                    rows: [
                        new TableRow({
                            children: accents.map(
                                (theme) =>
                                    new TableCell({
                                        shading: { type: ShadingType.CLEAR, fill: { theme } },
                                        children: [new Paragraph({ children: [new TextRun({ text: theme, color: { theme: "light1" } })] })],
                                    }),
                            ),
                        }),
                    ],
                }),
            ],
        },
    ],
});
```

Styles, tables and text that use the theme's fonts and colors, as here, take them from the theme. Choosing another theme on Word's **Design** tab changes them all, as it would for a document made in Word.

<!-- cspell:disable -->

| Theme              | Word's name              | Font for headings    | Font for body text   | Accent 1 |
| ------------------ | ------------------------ | -------------------- | -------------------- | -------- |
| `OFFICE`           | Office Theme             | Aptos Display        | Aptos                | `156082` |
| `OFFICE_2013_2022` | Office 2013 - 2022 Theme | Calibri Light        | Calibri              | `4472C4` |
| `ATLAS`            | Atlas                    | Calibri Light        | Rockwell             | `F81B02` |
| `BADGE`            | Badge                    | Impact               | Gill Sans MT         | `F8B323` |
| `BERLIN`           | Berlin                   | Trebuchet MS         | Trebuchet MS         | `F09415` |
| `CELESTIAL`        | Celestial                | Calibri Light        | Calibri              | `AC3EC1` |
| `CROP`             | Crop                     | Franklin Gothic Book | Franklin Gothic Book | `8C8D86` |
| `DEPTH`            | Depth                    | Corbel               | Corbel               | `41AEBD` |
| `DROPLET`          | Droplet                  | Tw Cen MT            | Tw Cen MT            | `2FA3EE` |
| `FACET`            | Facet                    | Trebuchet MS         | Trebuchet MS         | `90C226` |
| `FEATHERED`        | Feathered                | Century Schoolbook   | Calibri              | `606372` |
| `GALLERY`          | Gallery                  | Gill Sans MT         | Gill Sans MT         | `B71E42` |
| `HEADLINES`        | Headlines                | Century Schoolbook   | Corbel               | `439EB7` |
| `INTEGRAL`         | Integral                 | Tw Cen MT Condensed  | Tw Cen MT            | `1CADE4` |
| `ION`              | Ion                      | Century Gothic       | Century Gothic       | `B01513` |
| `ION_BOARDROOM`    | Ion Boardroom            | Century Gothic       | Century Gothic       | `B31166` |
| `MADISON`          | Madison                  | Arial                | Arial                | `A1D68B` |
| `MAIN_EVENT`       | Main Event               | Impact               | Impact               | `B80E0F` |
| `MESH`             | Mesh                     | Century Gothic       | Century Gothic       | `6F6F6F` |
| `ORGANIC`          | Organic                  | Garamond             | Garamond             | `83992A` |
| `PARALLAX`         | Parallax                 | Corbel               | Corbel               | `30ACEC` |
| `PARCEL`           | Parcel                   | Gill Sans MT         | Gill Sans MT         | `F6A21D` |
| `RETROSPECT`       | Retrospect               | Calibri Light        | Calibri              | `E48312` |
| `SAVON`            | Savon                    | Century Gothic       | Century Gothic       | `1CADE4` |
| `SLICE`            | Slice                    | Century Gothic       | Century Gothic       | `052F61` |
| `VAPOR_TRAIL`      | Vapor Trail              | Century Gothic       | Century Gothic       | `DF2E28` |
| `VIEW`             | View                     | Century Schoolbook   | Century Schoolbook   | `6F6F74` |
| `WISP`             | Wisp                     | Century Gothic       | Century Gothic       | `A53010` |
| `WOOD_TYPE`        | Wood Type                | Rockwell Condensed   | Rockwell             | `D34817` |

<!-- cspell:enable -->

`OFFICE` is the theme of new documents in Word today, with Aptos. `OFFICE_2013_2022` is the one before it, whose colors and fonts are those of the theme `docx` writes when no `theme` is given. The themes are Word for Mac's, from Word's own theme files, and have its fonts for other scripts, such as Japanese, where they differ from Office's.

A theme also has the fills, lines and effects of shapes that Word's shape styles use, which Word's **Design > Effects** gallery chooses. The theme `docx` writes always has Office's, whichever theme is given. Text, tables and the shapes of `docx/shapes` don't use them.

## Word's colors and fonts

`ColorSchemes` has the colors of Word's **Design > Colors** gallery, and `FontSchemes` the fonts of its **Design > Fonts** gallery. Give one to a theme's `colors` or `fonts`, to mix them with another theme, as Word's **Design** tab does:

```ts live
import { Document, HeadingLevel, Paragraph, TextRun } from "docx";
import { ColorSchemes, FontSchemes, Themes } from "docx/theme";

const doc = new Document({
    // Word's Facet theme, with its Blue Green colors and Georgia
    theme: { ...Themes.FACET, colors: ColorSchemes.BLUE_GREEN, fonts: FontSchemes.GEORGIA },
    styles: {
        default: {
            heading1: { run: { font: { theme: "headings" }, size: 32, color: { theme: "accent1" } } },
        },
    },
    sections: [
        {
            children: [
                new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun("In Georgia, and Blue Green's accent 1")] }),
                new Paragraph({ children: [new TextRun({ text: "Accent 2", color: { theme: "accent2" }, font: { theme: "body" } })] }),
            ],
        },
    ],
});
```

Or change only some of a theme's colors or fonts, keeping the rest:

```ts
theme: { ...Themes.FACET, colors: { ...Themes.FACET.colors, accent1: "1F6F8B" } },
```

<!-- cspell:disable -->

The colors are `OFFICE`, `OFFICE_2013_2022`, `OFFICE_2007_2010`, `ASPECT`, `BLUE`, `BLUE_GREEN`, `BLUE_II`, `BLUE_WARM`, `GRAYSCALE`, `GREEN`, `GREEN_YELLOW`, `MARQUEE`, `MEDIAN`, `ORANGE`, `ORANGE_RED`, `PAPER`, `RED`, `RED_ORANGE`, `RED_VIOLET`, `SLIPSTREAM`, `VIOLET`, `VIOLET_II`, `YELLOW` and `YELLOW_ORANGE`.

| Fonts                              | Font for headings      | Font for body text   |
| ---------------------------------- | ---------------------- | -------------------- |
| `OFFICE`                           | Aptos Display          | Aptos                |
| `OFFICE_2013_2022`                 | Calibri Light          | Calibri              |
| `OFFICE_2007_2010`                 | Cambria                | Calibri              |
| `ARIAL`                            | Arial                  | Arial                |
| `ARIAL_BLACK_ARIAL`                | Arial Black            | Arial                |
| `ARIAL_TIMES_NEW_ROMAN`            | Arial                  | Times New Roman      |
| `CALIBRI`                          | Calibri                | Calibri              |
| `CALIBRI_CAMBRIA`                  | Calibri                | Cambria              |
| `CALIBRI_LIGHT_CONSTANTIA`         | Calibri Light          | Constantia           |
| `CAMBRIA`                          | Cambria                | Cambria              |
| `CANDARA`                          | Candara                | Candara              |
| `CENTURY_GOTHIC`                   | Century Gothic         | Century Gothic       |
| `CENTURY_GOTHIC_PALATINO_LINOTYPE` | Century Gothic         | Palatino Linotype    |
| `CENTURY_SCHOOLBOOK`               | Century Schoolbook     | Century Schoolbook   |
| `CONSOLAS_VERDANA`                 | Consolas               | Verdana              |
| `CONSTANTIA_FRANKLIN_GOTHIC_BOOK`  | Constantia             | Franklin Gothic Book |
| `CORBEL`                           | Corbel                 | Corbel               |
| `FRANKLIN_GOTHIC`                  | Franklin Gothic Medium | Franklin Gothic Book |
| `GARAMOND`                         | Garamond               | Garamond             |
| `GARAMOND_TREBUCHET_MS`            | Garamond               | Trebuchet MS         |
| `GEORGIA`                          | Georgia                | Georgia              |
| `GILL_SANS_MT`                     | Gill Sans MT           | Gill Sans MT         |
| `TIMES_NEW_ROMAN_ARIAL`            | Times New Roman        | Arial                |
| `TREBUCHET_MS`                     | Trebuchet MS           | Trebuchet MS         |
| `TW_CEN_MT`                        | Tw Cen MT              | Tw Cen MT            |
| `TW_CEN_MT_ROCKWELL`               | Tw Cen MT              | Rockwell             |

<!-- cspell:enable -->

## The theme of a Word document or template

Styles made in Word, such as those of a template given in [`externalStyles`](usage/styling-with-xml.md), usually name the theme's fonts and colors rather than a font or a color: "(Headings)", or a table's shading in "Accent 5, Lighter 60%". They look as they did in Word only with the theme of the document they came from. `readTheme` reads that theme, to give `theme`:

```ts live
import * as fs from "fs";
import { Document, HeadingLevel, Paragraph, TextRun } from "docx";
import { readTheme } from "docx/theme";

// A document made in Word, whose theme is Office 2007's: Cambria for headings, Calibri for body text, and blue accents
const theme = readTheme(fs.readFileSync("./demo/assets/field-trip.docx"));

const doc = new Document({
    theme,
    styles: {
        default: {
            heading1: { run: { font: { theme: "headings" }, size: 32, color: { theme: "accent1" } } },
        },
    },
    sections: [
        {
            children: [
                new Paragraph({
                    heading: HeadingLevel.HEADING_1,
                    children: [new TextRun("In the theme's font for headings, and accent 1")],
                }),
                new Paragraph({
                    children: [
                        new TextRun({ text: "Accent 2, in the font for body text", color: { theme: "accent2" }, font: { theme: "body" } }),
                    ],
                }),
            ],
        },
    ],
});
```

It reads:

- a Word document or template (`.docx`, `.docm`, `.dotx` or `.dotm`), a PowerPoint presentation (`.pptx`), an Excel workbook (`.xlsx`) or an Office theme (`.thmx`), as bytes, such as a `Buffer`, a `Uint8Array` or an `ArrayBuffer`;
- the XML of a theme, such as a document's `word/theme/theme1.xml`, as text or bytes;
- the XML of colors or fonts that Word saves on their own, from **Design > Colors > Customize Colors** or **Design > Fonts > Customize Fonts**, as the theme's `colors` or `fonts`.

It gives the options of `theme`: the theme's `name`, its `colors`, and its `fonts` for headings and body text, with their fonts for other scripts. Change them before giving them to `theme` if you like, as for Word's themes. The fills, lines and effects of the theme's shape styles are Office's in the new document, as they are for every theme `docx` writes.

It throws for a file that isn't one of those, or that has no theme.

## Text in the theme's fonts

A run's or a style's `font` can be one of the theme's fonts: `{ theme: "headings" }` or `{ theme: "body" }`. It's the theme's font for every script, as Word's own styles use it.

```ts live
import { Document, HeadingLevel, Paragraph, TextRun } from "docx";

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

The library's own styles don't use the theme's fonts, so text looks as it always has until a style or a run asks for them. Word's styles, such as those in `externalStyles` taken from a Word document, use them: Word's `Normal` style is in the theme's font for body text, and its headings in the font for headings. The theme is the one `docx` writes, not the theme of the document the styles came from, so give that document's theme with [`readTheme`](#the-theme-of-a-word-document-or-template) to keep its fonts and colors.

## Text, tables and borders in the theme's colors

Wherever text, underlines, borders and shading take a color, they can take one of the theme's colors instead: `{ theme: "accent1" }`. They change color when the theme's colors change.

`lighter` and `darker` make the color lighter or darker, from 0 (unchanged) to 100 (white or black), as Word's color menus do: "Blue, Accent 1, Lighter 80%" is `{ theme: "accent1", lighter: 80 }`, and "Blue, Accent 1, Darker 25%" is `{ theme: "accent1", darker: 25 }`.

```ts live
import { BorderStyle, Document, HeadingLevel, Paragraph, ShadingType, TextRun, UnderlineType } from "docx";

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
                new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun("A heading in accent 1, darker 25%")] }),
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

```ts live
import { Document, Paragraph } from "docx";
import { ShapeRun } from "docx/shapes";

const doc = new Document({
    sections: [
        {
            children: [
                new Paragraph({
                    children: [
                        new ShapeRun({
                            type: "roundedRectangle",
                            transformation: { width: 120, height: 60 },
                            fill: { theme: "accent1", lighter: 80 },
                            line: { theme: "accent1", darker: 25 },
                        }),
                    ],
                }),
            ],
        },
    ],
});
```

## Examples

### Word's themes

[Example](https://raw.githubusercontent.com/dolanmiu/docx/master/demo/styles/word-themes.ts ":include")

_Source: https://github.com/dolanmiu/docx/blob/master/demo/styles/word-themes.ts_

### The theme of a Word document

[Example](https://raw.githubusercontent.com/dolanmiu/docx/master/demo/styles/theme-from-a-document.ts ":include")

_Source: https://github.com/dolanmiu/docx/blob/master/demo/styles/theme-from-a-document.ts_

### A theme of its own

[Example](https://raw.githubusercontent.com/dolanmiu/docx/master/demo/styles/theme.ts ":include")

_Source: https://github.com/dolanmiu/docx/blob/master/demo/styles/theme.ts_

### Text, tables and borders in the theme's colors

[Example](https://raw.githubusercontent.com/dolanmiu/docx/master/demo/styles/theme-colors.ts ":include")

_Source: https://github.com/dolanmiu/docx/blob/master/demo/styles/theme-colors.ts_
