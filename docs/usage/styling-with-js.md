# Styling with JS

## Example

```ts
const para = new Paragraph({
    text: "To whom it may concern:",
    heading: HeadingLevel.HEADING_2,
    alignment: AlignmentType.CENTER,
});

const name = new TextRun({
    text: "Name:",
    bold: true,
    font: "Calibri",
    allCaps: true,
});
```

## Available Options

### Run formatting

-   `bold`, `italics`, `smallCaps`, `allCaps`, `strike`, `doubleStrike`, `subScript`, `superScript`: Set the formatting property to true
-   `underline({type="single", color=null})`: Set the underline style and color
-   `emphasisMark({type="dot"})`: Set the emphasis mark style
-   `color(color)`: Set the text color, using 6 hex characters for RRGGBB (no leading `#`)
-   `size(halfPts)`: Set the font size, measured in half-points
-   `font(name)` or `font({ascii, cs, eastAsia, hAnsi, hint})`: Set the run's font
-   `style(name)`: Apply a named run style
-   `characterSpacing(value)`: Set the character spacing adjustment (in TWIPs)

### Paragraph formatting

-   `heading1`, `heading2`, `heading3`, `heading4`, `heading5`, `title`: apply the appropriate style to the paragraph
-   `left`, `center`, `right`, `justified`: set the paragraph's alignment
-   `thematicBreak`, `pageBreak`: Insert a thick rule or a page break beneath the paragraph
-   `leftTabStop(position)`: Add a left tab stop (measured in TWIPs from the left)
-   `maxRightTabStop`: Add a right tab stop at the far right
-   `bullet`: Use the default bullet style
-   `setNumbering(numbering, indentLevel)`: Use a custom numbering format for the paragraph
-   `style(name)`: Apply a named paragraph style
-   `indent(start, hanging=0)`: Set the paragraph's indent level (in TWIPs)
-   `spacing({before=0, after=0, line=0})`: Set the line and before/after on the paragraph. Before/after is measured in TWIPs, line is measured in 240ths of a line

Paragraph styles have all the run formatting methods, except `style()`, and `left()`, `center()`, `right()`, `justified()`, `thematicBreak()`, `leftTabStop(position)`, `maxRightTabStop()`, `indent(start, hanging=0)`, and `spacing({before=0, after=0, line=0})` methods.

## Detailed guide

There are 4 items in `docx` that can be styled:

-   Characters: Attributes that can change within a paragraph. e.g., bold, italics, etc.
-   Paragraphs: Attributes like indent, text alignment, line spacing, etc.
-   Tables: Border styles, table formats, etc.
-   List items: These are the numbers and bullets that are automatically inserted

There are a few different ways of styling this content in `docx`, which somewhat resemble the HTML/CSS approach. In order of greatest to lowest priority:

1.  Direct formatting (inline formatting)
2.  Declaritive Styles (similar to external CSS)
3.  Document defaults (similar to a `*` rule in CSS)

Unlike CSS, less specific rules don't _necessarily_ override parent rules. The rules are a bit wonky, but if you're interested, see the [advanced formatting section](#Advanced formatting).

### Direct formatting (inline formatting)

This is the type of formatting that your uncle uses when he types out documents: _N ... a ... m ... e ... :_ Then he grabs the mouse, highlights _Name:_ and moves over to the **B** for bold. This manner of formatting results in markup that is similar to writing `<span style="bold: true">Name:</span>` if you were typing out HTML. `docx` (the format) allows you to specify this for any of the four types of items. `docx` (the library) only supports this type of formatting for paragraphs and characters, using a _fluent_ api. Thus you could do:

```ts
const name = new TextRun({
    text: "Name:",
    bold: true,
    font: "Calibri",
    allCaps: true,
});
```

Or for paragraph formatting:

```ts
const para = new Paragraph({
    text: "To whom it may concern:",
    heading: HeadingLevel.HEADING_2,
    alignment: AlignmentType.CENTER,
});
```

### Declaritive Styles (similar to external CSS)

`docx` files contain a styles section separate from the main content, much like how HTML includes CSS files. Unlike CSS, `docx` distinguishes between styles meant for tables (which show up in the table formatting toolbar), styles for lists (which show up under bullets and numbering), and styles for runs and paragraphs, which show up as dropdowns offering standard styles, like "Heading 1", "Caption", or any custom styles defined in that document. <!-- TODO: add pictures of the panes -->. `docx` allows you to define these styles using a fluent interface as well.

To add styles, define your custom styles in the `document`:

```ts
// The first argument is an ID you use to apply the style to paragraphs
// The second argument is a human-friendly name to show in the UI
const doc = new Document({
    creator: "Clippy",
    title: "Sample Document",
    description: "A brief example of using docx",
    styles: {
        paragraphStyles: [
            {
                id: "myWonkyStyle",
                name: "My Wonky Style",
                basedOn: "Normal",
                next: "Normal",
                quickFormat: true,
                run: {
                    italics: true,
                    color: "999999",
                },
                paragraph: {
                    spacing: {
                        line: 276,
                    },
                    indent: {
                        left: 720,
                    },
                },
            },
            {
                id: "Heading2",
                name: "Heading 2",
                basedOn: "Normal",
                next: "Normal",
                quickFormat: true,
                run: {
                    size: 26
                    bold: true,
                    color: "999999",
                    {
                        type: UnderlineType.DOUBLE,
                        color: "FF0000",
                    },
                },
                paragraph: {
                    spacing: {
                        before: 240,
                        after: 120
                    },
                },
            },
        ]
    }
});
```

**Note**: If you are using the `.headingX` or `.title` methods of paragraphs, you must make sure to define `HeadingX` or `Title` styles for these. Otherwise they'll show up un-styled :(. If you are using the `.bullet` or `.setNumbering` methods, you need to define a `ListParagraph` style or the numbers may not show up.

### Document defaults

Setting document defaults acts like a `*` rule in CSS: it applies to every paragraph and run in the document, but at a low priority level. Other styles affecting this property will override these defaults.

## Advanced formatting

### Style inheritance

Styles may define a `basedOn` attribute that references another style of the same type. In this case, any unspecified properties are inherited from the parent style.

### Interactions between the 4 items

In addition to the 3-layer hierarchy spelled above, there is some interaction between the 4 items that you can style.
For instance numbering styles may also specify some styling for paragraphs (typically indentation and tab stops); paragraphs may specify character formatting (e.g., heading font sizes); etc.

The elements that each style may affect are summarized in the table below. So, e.g., table styles may specify table formatting, paragraph formatting, and character formatting.

| Style type        | Table | Paragraph | List item | Characters |
| :---------------- | :---: | :-------: | :-------: | :--------: |
| Document defaults |       |     X     |           |     X      |
| Table             |   X   |     X     |           |     X      |
| Paragraph         |       |     X     |     X     |     X      |
| Numbering         |       |     X     |     X     |            |
| Character         |       |           |           |     X      |
| Direct formatting |   X   |     X     |     X     |     X      |

To determine the value of a styling property, you must first identify whether it's a table, paragraph, list item, or character property. E.g., numbering definition is a list item property. Then you need to find the last row in the table for which that property has an "X" and the document has formatting of that type. So if a particular run was in a paragraph whose style specified color as `FF0000`, but it also had a character style specifying color as `00DD00`, then the character style (lower down on the table) would trump, and the character would have color `00DD00`.

### Toggle properties

The following properties are treated in a special manner; they're called toggle properties:

-   Bold
-   All caps
-   Small caps
-   Italics
-   Single strike-through
-   Hidden
-   Imprint
-   Emboss
-   Character outline
-   Character shadow

For these properties, the rules state the following conflict resolution in case the property is specified at multiple points for the same item:

-   Direct formatting trumps all if specified (either true or false)
-   Otherwise, if the property is true in document defaults, the property is set to true
-   Otherwise, the property's value is an XOR of its effective table, paragraph, and character values. (So specifying bold `true` on a table style and a paragraph style would result in non-bold text if a paragraph inside the table had that style)

## Examples

### Declarative styles

Importing Images from file system path

[Example](https://raw.githubusercontent.com/dolanmiu/docx/master/demo/2-declaritive-styles.ts ':include')

_Source: https://github.com/dolanmiu/docx/blob/master/demo/2-declaritive-styles.ts_
