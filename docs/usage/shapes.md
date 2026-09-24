# Shapes

!> Shapes require an understanding of [Paragraphs](usage/paragraph.md).

Shapes are drawings made from lines and fills rather than pictures: rectangles, ellipses, lines, arrows, stars, callouts, flowchart symbols and more. Use a `ShapeRun` for one shape, a `ShapeGroupRun` for several shapes that belong together, and a `ShapeCanvasRun` for diagrams whose shapes are joined by connectors.

Like an image, a shape is a run inside a `Paragraph`. It sits in the line of text unless you make it `floating`.

## Common Use Cases

| I want to...                                  | Use                                          | Example                       |
| --------------------------------------------- | -------------------------------------------- | ----------------------------- |
| Draw a bar or blank line in a sentence        | `rectangle` with a `fill` and `line: "none"` | Blanks on a printed form      |
| Draw a line to write or sign on               | `line` with `height: 0`                      | Signature line                |
| Point at something                            | `line` with an arrowhead                     | Arrow in a diagram            |
| Put text in a coloured box, circle or callout | Any shape with `text` or `children`          | Flowchart step, speech bubble |
| Make a shape as big as its text               | `width: "fitText"` or `height: "fitText"`    | Buttons, labels, tags         |
| Place a shape anywhere on the page            | `floating`                                   | Stamp in a corner             |
| Keep several shapes together as one drawing   | `ShapeGroupRun`                              | Badge, simple diagram         |
| Join shapes with lines that follow them       | `ShapeCanvasRun` with connectors             | Flowchart, org chart          |
| Lay out a diagram without working out offsets | `layout` on a canvas or group                | Flowchart, org chart, grid    |
| Crop a photo to a circle                      | `ellipse` with a picture `fill`              | Profile picture               |
| Add a shadow, glow or reflection              | `effects`                                    | Card with a drop shadow       |
| Draw a shape that isn't a preset              | `type: "custom"` with an SVG `path`          | Logo, badge, freeform outline |

## Importing

Shapes come with the `docx` package. Import them from `docx/shapes`, and everything else, such as the document and its paragraphs, from `docx`:

```ts
import { Document, Packer, Paragraph } from "docx";
import { ShapeCanvasRun, ShapeGroupRun, ShapeRun } from "docx/shapes";
```

The examples on this page use `ShapeRun`, `ShapeGroupRun` and `ShapeCanvasRun` from `docx/shapes`. Types such as `IShapeGroupChildOptions` come from there too.

In a page without a bundler, load the shapes after `docx`: `dist/shapes.umd.cjs` after `dist/index.umd.cjs`, or `dist/shapes.iife.js` after `dist/index.iife.js`. They add a `docxShapes` global next to the `docx` one:

```html
<script src="node_modules/docx/dist/index.umd.cjs"></script>
<script src="node_modules/docx/dist/shapes.umd.cjs"></script>
<script>
    const shape = new docxShapes.ShapeRun({ type: "ellipse", transformation: { width: 100, height: 60 } });
</script>
```

## Basic Usage

```ts
import { Document, Packer, Paragraph, TextRun } from "docx";
import { ShapeRun } from "docx/shapes";

const doc = new Document({
    sections: [
        {
            children: [
                new Paragraph({
                    children: [
                        new TextRun("Name: "),
                        new ShapeRun({
                            type: "rectangle",
                            transformation: { width: 200, height: 4 },
                            fill: "000000",
                            line: "none",
                        }),
                    ],
                }),
            ],
        },
    ],
});
```

This draws a black bar 200 pixels wide and 4 pixels tall after the text "Name: ".

With no `fill` or `line`, a shape has no fill and a black line 1pt wide, so it is always visible:

```ts
new ShapeRun({ type: "ellipse", transformation: { width: 100, height: 60 } });
```

## Shape Types

`type` is the name of one of the 187 preset shapes in Office Open XML. The names say what each shape is, such as `roundedRectangle` or `ribbonUp`. Some common ones are:

<!-- cspell:disable -->

| Category          | Shapes                                                                                                                      |
| ----------------- | --------------------------------------------------------------------------------------------------------------------------- |
| Basic shapes      | `rectangle`, `roundedRectangle`, `ellipse`, `triangle`, `rightTriangle`, `diamond`, `parallelogram`, `trapezoid`, `hexagon` |
| Lines             | `line`, `straightConnector`, `elbowConnector`, `curvedConnector`                                                            |
| Block arrows      | `rightArrow`, `leftArrow`, `upArrow`, `downArrow`, `leftRightArrow`, `bentArrow`, `uTurnArrow`, `circularArrow`             |
| Stars and banners | `star4`, `star5`, `star6`, `star8`, `star12`, `explosion12`, `ribbonUp`, `ribbonDown`, `wave`, `horizontalScroll`           |
| Callouts          | `rectangularCallout`, `roundedRectangularCallout`, `ellipticalCallout`, `cloudCallout`, `lineCallout`                       |
| Flowchart         | `flowChartProcess`, `flowChartDecision`, `flowChartTerminator`, `flowChartDocument`, `flowChartMagneticDisk`                |
| Symbols           | `heart`, `lightningBolt`, `sun`, `moon`, `smileyFace`, `cloud`, `noSymbol`, `cross`, `gear6`, `gear9`                       |

<!-- cspell:enable -->

The `PresetShapeType` type lists every shape, so your editor can suggest them as you type. [Shape Types](usage/shape-types.md) lists all of them, with the name each one has in the OOXML specification.

## Size and Rotation

`transformation` works the same way as for [images](usage/images.md):

| Property   | Type                                           | Notes    | Description                                                                                    |
| ---------- | ---------------------------------------------- | -------- | ---------------------------------------------------------------------------------------------- |
| `width`    | `number` \| `"fitText"`                        | Required | Width in pixels, or `"fitText"`. See [Sizing a shape to its text](#sizing-a-shape-to-its-text) |
| `height`   | `number` \| `"fitText"`                        | Required | Height in pixels, or `"fitText"`                                                               |
| `rotation` | `number`                                       | Optional | Clockwise rotation in degrees                                                                  |
| `flip`     | `{ horizontal?: boolean; vertical?: boolean }` | Optional | Mirrors the shape                                                                              |
| `offset`   | `{ left?: number; top?: number }`              | Optional | Position in pixels. Only used for shapes in a group or canvas                                  |

### Lines

A line runs from the top-left corner of its box to the bottom-right corner:

- `height: 0` draws a horizontal line, and `width: 0` a vertical one.
- Any other size draws a diagonal line. Add `flip: { vertical: true }` to run it from the bottom-left to the top-right instead.
- `startArrow` goes where the line starts (the top-left, or the bottom-left when flipped vertically) and `endArrow` where it ends.

To join two shapes, use a [connector](#connectors) instead. It is drawn from one shape to the other for you.

```ts
// Horizontal
new ShapeRun({ type: "line", transformation: { width: 300, height: 0 } });

// Up and to the right, with an arrowhead at the top
new ShapeRun({
    type: "line",
    transformation: { width: 120, height: 60, flip: { vertical: true } },
    line: { endArrow: "triangle" },
});
```

## Fill

`fill` can be a colour, `"none"`, a solid fill, a gradient, a pattern or a picture. Colours are 6-digit hex values, with or without a `#`.

```ts
// A colour
new ShapeRun({ type: "rectangle", transformation: { width: 100, height: 50 }, fill: "4472C4" });

// A colour with transparency, from 0 (opaque) to 100 (invisible)
new ShapeRun({ type: "ellipse", transformation: { width: 90, height: 90 }, fill: { color: "FF0000", transparency: 50 } });

// No fill (the default)
new ShapeRun({ type: "rectangle", transformation: { width: 100, height: 50 }, fill: "none" });
```

### Gradients

A gradient needs at least two `stops`. Each stop has a `position` from 0 to 100 along the gradient, a `color` and an optional `transparency`.

```ts
// Linear, from top to bottom
new ShapeRun({
    type: "rectangle",
    transformation: { width: 160, height: 80 },
    fill: {
        type: "gradient",
        angle: 90,
        stops: [
            { position: 0, color: "9DC3E6" },
            { position: 100, color: "1F4E79" },
        ],
    },
});

// Radial, from the centre outwards
new ShapeRun({
    type: "ellipse",
    transformation: { width: 80, height: 80 },
    fill: {
        type: "gradient",
        path: "circle",
        stops: [
            { position: 0, color: "FFFFFF" },
            { position: 100, color: "ED7D31" },
        ],
    },
});
```

| Property | Type                                     | Notes    | Description                                                                                                                   |
| -------- | ---------------------------------------- | -------- | ----------------------------------------------------------------------------------------------------------------------------- |
| `type`   | `"gradient"`                             | Required |                                                                                                                               |
| `stops`  | `GradientStop[]`                         | Required | At least two colour stops                                                                                                     |
| `angle`  | `number`                                 | Optional | Direction of a linear gradient in degrees, clockwise. `0` (the default) runs left to right and `90` runs top to bottom        |
| `path`   | `"circle"` \| `"rectangle"` \| `"shape"` | Optional | Makes the gradient radiate from the centre in a circle, a rectangle or following the shape's outline, instead of being linear |

### Pattern fills

A pattern fill repeats lines or dots in one colour over another. [Shape Patterns and Text Warps](usage/shape-patterns-and-warps.md#patterns) lists all 54 patterns.

```ts
new ShapeRun({
    type: "rectangle",
    transformation: { width: 80, height: 60 },
    fill: { type: "pattern", pattern: "wideUpwardDiagonal", color: "2F5597", backgroundColor: "DEEBF7" },
});
```

| Property          | Type           | Notes    | Description                                                      |
| ----------------- | -------------- | -------- | ---------------------------------------------------------------- |
| `type`            | `"pattern"`    | Required |                                                                  |
| `pattern`         | `ShapePattern` | Required | Such as `"percent20"`, `"horizontal"`, `"smallCheckerBoard"`     |
| `color`           | `string`       | Optional | 6-digit hex colour of the lines and dots. Default is `000000`    |
| `backgroundColor` | `string`       | Optional | 6-digit hex colour of the space behind them. Default is `FFFFFF` |

### Picture fills

A picture fill puts a picture inside the shape, and the shape's outline crops it. `image` takes the same `type` and `data` as an [`ImageRun`](usage/images.md), including SVG with a `fallback`. The picture is stretched to fill the shape unless you `tile` it.

```ts
// A photo cropped to a circle
new ShapeRun({
    type: "ellipse",
    transformation: { width: 80, height: 80 },
    fill: { type: "picture", image: { type: "jpg", data: fs.readFileSync("./photo.jpg") } },
    line: { color: "FFFFFF", width: 3 },
});

// A picture repeated across a heart, at a fifth of its size, with every other tile mirrored
new ShapeRun({
    type: "heart",
    transformation: { width: 80, height: 80 },
    fill: { type: "picture", image: { type: "png", data: pattern }, tile: { scale: 20, mirror: "both" } },
});
```

| Property       | Type           | Notes    | Description                                                                      |
| -------------- | -------------- | -------- | -------------------------------------------------------------------------------- |
| `type`         | `"picture"`    | Required |                                                                                  |
| `image`        | `ImageSource`  | Required | `{ type, data }`, as for an `ImageRun`                                           |
| `tile`         | `PictureTile`  | Optional | Repeats the picture at its own size instead of stretching it. See below          |
| `crop`         | `ICropOptions` | Optional | Crops a percentage, from 0 to 100, off each side before the picture is stretched |
| `transparency` | `number`       | Optional | From `0` (opaque) to `100` (invisible)                                           |

`tile` takes a `scale` (percent of the picture's own size, default `100`), an `alignment` for the first tile (`"topLeft"`, the default, `"top"`, `"topRight"`, `"left"`, `"center"`, `"right"`, `"bottomLeft"`, `"bottom"` or `"bottomRight"`) and `mirror` (`"none"`, the default, `"horizontal"`, `"vertical"` or `"both"`), which mirrors every other tile.

## Line

`line` is the shape's outline, or the line itself for `line` and connector shapes. It can be a colour, `"none"` or an object:

```ts
new ShapeRun({
    type: "line",
    transformation: { width: 300, height: 0 },
    line: {
        color: "C00000",
        width: 2,
        dash: "dash",
        startArrow: "oval",
        endArrow: { type: "triangle", width: "large", length: "large" },
    },
});
```

| Property       | Type                                                                     | Notes    | Description                                                              |
| -------------- | ------------------------------------------------------------------------ | -------- | ------------------------------------------------------------------------ |
| `color`        | `string`                                                                 | Optional | 6-digit hex colour. Default is `000000` (black)                          |
| `width`        | `number`                                                                 | Optional | Width in points, from `0` to `1584`. Default is `1`                      |
| `transparency` | `number`                                                                 | Optional | From `0` (opaque) to `100` (invisible)                                   |
| `dash`         | `LineDash` \| `CustomLineDash`                                           | Optional | A dash pattern, or dashes of your own. Default is a solid line           |
| `cap`          | `"flat"` \| `"round"` \| `"square"`                                      | Optional | The shape of the line's ends and of each dash's ends                     |
| `join`         | `"miter"` \| `"round"` \| `"bevel"`                                      | Optional | The shape of the corners where the line turns: sharp, rounded or cut off |
| `compound`     | `"single"` \| `"double"` \| `"thickThin"` \| `"thinThick"` \| `"triple"` | Optional | Draws the line as two or three parallel lines                            |
| `gradient`     | `{ stops, angle?, path? }`                                               | Optional | Colours the line with a [gradient](#gradients) instead of `color`        |
| `startArrow`   | `Arrowhead`                                                              | Optional | Arrowhead at the start of the line                                       |
| `endArrow`     | `Arrowhead`                                                              | Optional | Arrowhead at the end of the line                                         |

<!-- cspell:disable -->

| `dash`            | Pattern                                   |
| ----------------- | ----------------------------------------- |
| `solid`           | Solid (default)                           |
| `shortDot`        | Round dot                                 |
| `shortDash`       | Square dot                                |
| `dash`            | Dash                                      |
| `dashDot`         | Dash dot                                  |
| `longDash`        | Long dash                                 |
| `longDashDot`     | Long dash dot                             |
| `longDashDotDot`  | Long dash dot dot                         |
| `dot`             | Dots with wider gaps                      |
| `shortDashDot`    | Dash dot with the dots close together     |
| `shortDashDotDot` | Dash dot dot with the dots close together |

<!-- cspell:enable -->

A custom dash is a list of dashes and the gaps after them, each measured in multiples of the line's width. With round caps, a dash of length `0` draws a round dot:

```ts
// Round dots, then dashes three times as long as the line is wide
line: { width: 3, cap: "round", dash: [{ length: 0, gap: 2 }, { length: 3, gap: 2 }] },
```

An `Arrowhead` is one of `"triangle"`, `"stealth"`, `"diamond"`, `"oval"` or `"arrow"`, or an object with a `type` and a `width` and `length` of `"small"`, `"medium"` (the default) or `"large"`.

?> Arrowheads can be put on any shape's line, but they are only drawn on open shapes such as `line`, the connectors and `arc`.

## Text in Shapes

`text` puts a line of text in the middle of a shape, in the document's default font. Each `\n` starts a new, centred paragraph:

```ts
new ShapeRun({ type: "flowChartProcess", text: "Review", transformation: { width: 120, height: 40 }, fill: "DEEBF7" });
```

For text with formatting, add paragraphs to `children`. The text is centred vertically. Use the paragraph's `alignment` to centre it horizontally. `text` comes before `children` when a shape has both.

```ts
new ShapeRun({
    type: "flowChartTerminator",
    transformation: { width: 120, height: 48 },
    fill: "4472C4",
    line: "none",
    children: [
        new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [new TextRun({ text: "Start", color: "FFFFFF", bold: true })],
        }),
    ],
});
```

### Sizing a shape to its text

Set `width` or `height` to `"fitText"` to size a shape to its text:

```ts
// As wide as "Write the draft" on one line, and 40 pixels tall
new ShapeRun({ type: "flowChartProcess", text: "Write the draft", transformation: { width: "fitText", height: 40 } });

// 160 pixels wide, and as tall as the text wrapped at that width
new ShapeRun({
    type: "rectangle",
    children: [new Paragraph("A longer note that wraps")],
    transformation: { width: 160, height: "fitText" },
});
```

- `width: "fitText"` fits the longest line of text, without wrapping.
- `height: "fitText"` fits every line, wrapped at the shape's width unless `textOptions.wrap` is `false`.
- Both include the text margins, and allow for shapes whose text box is smaller than the shape, such as ellipses and diamonds.
- Text that runs up or down the shape (`textOptions.direction`) is measured across the shape's height.

The size is worked out when the document is made, from how wide each character is in the run's font and size. Widths are built in for Calibri, Cambria, Arial, Times New Roman and Courier New. Other fonts are measured as the one most like them: Aptos and other sans-serif fonts as Arial, and serif fonts as Times New Roman. Text without a font or size of its own is measured in Word's defaults, 10pt Times New Roman, because the document's styles aren't known when the shape is made. Give the runs a `font` and `size` if your document uses other defaults.

The estimate is close for the built-in fonts and rougher for others. For an exact fit once Word has laid the text out, use `textOptions.resizeShapeToFitText` as well.

### Text layout

`textOptions` sets how the text is laid out in the shape:

```ts
new ShapeRun({
    type: "rectangle",
    transformation: { width: 200, height: 100 },
    children: [new Paragraph("Top left")],
    textOptions: {
        verticalAlignment: "top",
        margins: { top: 4, right: 8, bottom: 4, left: 8 }, // points
    },
});
```

| Property               | Type                                | Description                                                                                                         |
| ---------------------- | ----------------------------------- | ------------------------------------------------------------------------------------------------------------------- |
| `verticalAlignment`    | `"top"` \| `"center"` \| `"bottom"` | Where the text sits between the top and bottom of the shape. Default is `"center"`                                  |
| `margins`              | `{ top, right, bottom, left }`      | Space between the shape's edges and the text, in points. Word's defaults are 7.2 left and right, 3.6 top and bottom |
| `wrap`                 | `boolean`                           | Whether lines wrap at the shape's edges. Default is `true`                                                          |
| `resizeShapeToFitText` | `boolean`                           | Grows or shrinks the shape to fit its text when Word lays it out                                                    |
| `shrinkTextOnOverflow` | `boolean`                           | Makes the text smaller when there is too much of it. Can't be used with `resizeShapeToFitText`                      |
| `direction`            | `ShapeTextDirection`                | `"horizontal"` (the default), `"topToBottom"`, `"bottomToTop"`, `"stacked"` and more                                |
| `columns`              | `{ count, spacing? }`               | Lays the text out in 1 to 16 columns, `spacing` points apart                                                        |
| `warp`                 | `ShapeTextWarp`                     | Bends or stretches the text like WordArt, such as `"archUp"`, `"wave"` or `"inflate"`                               |

[Shape Patterns and Text Warps](usage/shape-patterns-and-warps.md) lists every warp and direction. Word applies `resizeShapeToFitText` and `shrinkTextOnOverflow` when it next lays the shape out, such as when the text is edited.

```ts
// WordArt: text bent into an arch
new ShapeRun({
    type: "rectangle",
    transformation: { width: 200, height: 80 },
    line: "none",
    children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "WordArt", size: 48, bold: true })] })],
    textOptions: { warp: "archUp", wrap: false },
});
```

?> Word may not show text in columns inside a shape. PowerPoint and LibreOffice do.

## Adjustments

Many shapes have handles in Word that change their proportions, such as the corner radius of a rounded rectangle or the thickness of an arrow. `adjustments` sets them. Each shape has its own adjustments, named after what they change:

<!-- cspell:disable -->

| Shape                                     | Adjustments                                           | Default           |
| ----------------------------------------- | ----------------------------------------------------- | ----------------- |
| `roundedRectangle`                        | `cornerRadius`: radius of the corners                 | `16.667`          |
| `triangle`                                | `apexPosition`: where the top point is, from the left | `50`              |
| `star5`                                   | `innerRadius`: radius of the inner points             | `38.196`          |
| `donut`                                   | `thickness`: thickness of the ring                    | `25`              |
| `rightArrow`                              | `shaftThickness`, `headLength`                        | `50`, `50`        |
| `pie`, `arc`, `chord`                     | `startAngle`, `endAngle`                              | depends on shape  |
| `rectangularCallout`, `ellipticalCallout` | `pointerX`, `pointerY`: tip of the pointer            | `-20.833`, `62.5` |

<!-- cspell:enable -->

Lengths and positions are percentages, and angles are in degrees clockwise from 3 o'clock. Most lengths are a percentage of the shape's shorter side, so a `cornerRadius` of `50` makes the ends of a rounded rectangle fully round. [Shape Adjustments](usage/shape-adjustments.md) lists the adjustments of all 120 shapes that have them, with what each percentage is of and its default.

```ts
new ShapeRun({
    type: "roundedRectangle",
    adjustments: { cornerRadius: 30 },
    transformation: { width: 120, height: 60 },
    fill: "ED7D31",
});

new ShapeRun({
    type: "pie",
    adjustments: { startAngle: 0, endAngle: 270 },
    transformation: { width: 60, height: 60 },
    fill: "7030A0",
});
```

In TypeScript, `adjustments` only accepts the names that belong to the shape's `type`, so your editor suggests them. Word keeps each value within the range the shape allows, so a value that is too large acts like the largest allowed value.

## Effects

`effects` adds shadows, a glow, soft edges and a reflection. They can be combined, and each takes sizes in points and angles in degrees:

```ts
new ShapeRun({
    type: "roundedRectangle",
    transformation: { width: 120, height: 60 },
    fill: "DEEBF7",
    effects: {
        shadow: {}, // Word's "Offset: Bottom Right" shadow
        glow: { color: "FFC000", size: 8 },
    },
});
```

| Effect        | Type              | Description                                                                                              |
| ------------- | ----------------- | -------------------------------------------------------------------------------------------------------- |
| `shadow`      | `ShapeShadow`     | A shadow behind the shape. `{}` gives a black shadow 60% transparent, 3pt away, down and to the right    |
| `innerShadow` | `ShapeShadow`     | A shadow inside the shape, as if it were cut out of the page                                             |
| `glow`        | `ShapeGlow`       | A glow around the shape: a `color`, a `size` in points (default `5`) and a `transparency` (default `60`) |
| `softEdges`   | `number`          | Blurs the shape's edges inwards by this many points                                                      |
| `reflection`  | `ShapeReflection` | A reflection below the shape. `{}` gives a half reflection touching the shape                            |

A shadow has a `color` (default `000000`), `transparency` (default `60`), `blur` in points (default `4`), `distance` in points (default `3`) and `angle`, the direction it falls in degrees clockwise from 3 o'clock (default `45`). A reflection has a `transparency` where it meets the shape (default `50`), a `size`, the percentage of the shape it reflects (default `50`), a `distance` below the shape and a `blur`, both in points.

The drawing's box grows to make room for the effects, so they aren't cut off.

## Custom Shapes

For a shape that isn't one of the presets, give `type: "custom"` and the outline as SVG path data. The path can be in any units: it is scaled so the box around it fills the shape's `transformation`.

```ts
// A star
new ShapeRun({
    type: "custom",
    path: "M 50 0 L 61 35 L 98 35 L 68 57 L 79 91 L 50 70 L 21 91 L 32 57 L 2 35 L 39 35 Z",
    transformation: { width: 80, height: 76 },
    fill: "FFC000",
});

// An open curve, with arrowheads
new ShapeRun({
    type: "custom",
    path: "M 0 50 C 30 0 70 100 100 50",
    transformation: { width: 120, height: 50 },
    line: { width: 2, endArrow: "triangle" },
});
```

The path can use the commands `M` (move), `L` (line), `H` and `V` (horizontal and vertical lines), `C` and `S` (cubic curves), `Q` and `T` (quadratic curves), `A` (elliptical arcs) and `Z` (close), in upper case for absolute coordinates and lower case for relative ones. A path that isn't closed is still filled, as in SVG, but its line and arrowheads are drawn only along the path.

Custom shapes can hold text like any other shape. Connectors attach to the corners and ends of the path.

## Links and Decorative Shapes

`link` makes a shape open a web address when it is clicked (with Ctrl, in Word). `decorative: true` is Word's **Mark as decorative**: screen readers skip the shape, which suits divider bars and other shapes that don't carry meaning.

```ts
new ShapeRun({
    type: "roundedRectangle",
    transformation: { width: 160, height: 40 },
    fill: "4472C4",
    children: [new Paragraph("Visit docx.js.org")],
    link: "https://docx.js.org",
});

new ShapeRun({ type: "rectangle", transformation: { width: 600, height: 3 }, fill: "BFBFBF", line: "none", decorative: true });
```

Groups, canvases and the shapes, pictures and groups inside them take `link` and `decorative` too.

## Inline and Floating

A shape sits in the line of text by default. It is aligned to the text baseline and its height adds to the height of the line.

Add `floating` to position it on the page instead. The options are the same as for [floating images](usage/images.md#floating), including `horizontalPosition`, `verticalPosition`, `wrap`, `margins`, `behindDocument` and `zIndex`. Offsets are in [EMUs](https://startbigthinksmall.wordpress.com/2010/01/04/points-inches-and-emus-measuring-units-in-office-open-xml/) (914400 per inch).

```ts
new ShapeRun({
    type: "roundedRectangularCallout",
    transformation: { width: 180, height: 80 },
    fill: "FFF2CC",
    children: [new Paragraph("Shapes can float, too!")],
    floating: {
        horizontalPosition: { relative: HorizontalPositionRelativeFrom.COLUMN, offset: 4000000 },
        verticalPosition: { relative: VerticalPositionRelativeFrom.PARAGRAPH, offset: 0 },
        wrap: { type: TextWrappingType.SQUARE, side: TextWrappingSide.LEFT },
    },
});
```

?> Use `TextWrappingType.SQUARE` or `TextWrappingType.TOP_AND_BOTTOM` to wrap text around a shape's box. `TextWrappingType.TIGHT` and `TextWrappingType.THROUGH` wrap it around the shape's outline instead.

## Alternative Text

Give a shape `altText` so screen readers can describe it:

```ts
new ShapeRun({
    type: "star5",
    transformation: { width: 60, height: 60 },
    fill: "FFC000",
    altText: { name: "Gold star", description: "A gold star awarded for good work" },
});
```

## Groups

A `ShapeGroupRun` keeps several shapes together, so they move, resize and wrap as one drawing. Each shape takes the same options as a `ShapeRun`, except `floating`, and its `transformation.offset` positions it in pixels.

```ts
new ShapeGroupRun({
    children: [
        { type: "ellipse", transformation: { width: 80, height: 80 }, fill: "5B9BD5", line: "none" },
        { type: "star5", transformation: { offset: { left: 15, top: 12 }, width: 50, height: 50 }, fill: "FFC000" },
    ],
});
```

The group is as big as the box around its shapes. Give it a `transformation` to scale every shape in it to a different size, or to rotate or flip them together:

```ts
new ShapeGroupRun({
    children: [/* ... */],
    transformation: { width: 40, height: 40, rotation: 20 }, // half the size, turned by 20 degrees
});
```

A group can be `floating`, and can have `altText`, just like a single shape.

### Pictures and Groups Inside Groups

A group or canvas can also hold pictures and other groups. A picture takes an `image`, as for an `ImageRun`, and a `transformation`. Connectors attach to the middle of its sides, and it can have a `line`, `effects` and a `crop`:

```ts
{ id: "logo", type: "picture", image: { type: "png", data: fs.readFileSync("./logo.png") }, transformation: { width: 60, height: 70 } }
```

A group inside a group keeps its children together. Its children are positioned relative to each other, and its `transformation.offset` places the group. Give it a `width` and `height` to scale its children, or a `rotation` or `flip`:

```ts
new ShapeGroupRun({
    children: [
        { type: "rectangle", transformation: { width: 200, height: 100 }, fill: "F2F2F2" },
        {
            type: "group",
            transformation: { offset: { left: 60, top: 10 }, width: 40, height: 40, rotation: 20 }, // half size, turned
            children: [
                { type: "ellipse", transformation: { width: 80, height: 80 }, fill: "5B9BD5", line: "none" },
                { type: "star5", transformation: { offset: { left: 15, top: 12 }, width: 50, height: 50 }, fill: "FFC000" },
            ],
        },
    ],
});
```

Connectors can attach to shapes and pictures inside groups, so every `id` must be different across the whole drawing. A connector inside a group can only join shapes in that group.

## Connectors

A connector is a line from one shape to another. Give each shape an `id`, then add a child with `type: "connector"` that names the shapes it joins. The connector is drawn between them, so it needs no size or position:

```ts
new ShapeCanvasRun({
    children: [
        { id: "start", type: "flowChartTerminator", transformation: { width: 120, height: 40 }, fill: "4472C4" },
        { id: "step", type: "flowChartProcess", transformation: { offset: { top: 90 }, width: 120, height: 44 }, fill: "ED7D31" },
        { type: "connector", from: "start", to: "step", line: { endArrow: "triangle" } },
    ],
});
```

A connector attaches to the sides of the shapes that face each other. To choose a side, give an object with the shape's `id` and a `side` of `"top"`, `"right"`, `"bottom"` or `"left"`:

```ts
{ type: "connector", from: { id: "fix", side: "top" }, to: { id: "draft", side: "right" }, route: "elbow" }
```

To attach to a particular point, give a `point` instead of a `side`, as percentages of the shape's width and height before it is rotated. The connector attaches to the connection point nearest it, such as the tip of a diamond:

```ts
// From the right-hand point of a decision diamond
{ type: "connector", from: { id: "ask", point: { x: 100, y: 50 } }, to: "wait" }
```

`route` sets the path the connector takes:

| `route`      | Path                                                                                      |
| ------------ | ----------------------------------------------------------------------------------------- |
| `"straight"` | A straight line between the two shapes (the default)                                      |
| `"elbow"`    | Horizontal and vertical lines with right-angled bends, like Word's elbow connector        |
| `"curved"`   | A smooth curve that leaves and arrives square to the shapes, like Word's curved connector |

Elbow and curved connectors leave and arrive at right angles to the sides they attach to, and go around a shape when they have to, for example to join two shapes' top sides. `margin` sets how far out they go, in pixels (default `24`, a quarter of an inch).

When the usual route would cross another shape in the group or canvas, an elbow or curved connector takes a route with up to four bends that goes around it, a margin away, if there is one.

Without a `route`, a connector is straight, unless a straight line would go through another shape in the group or canvas. Then it takes an elbow route around it. Give `route: "straight"` to keep it straight anyway.

`label` puts text on a connector, in a box centred on its route. Give a background `fill` to hide the line behind the text:

```ts
{ type: "connector", from: "ask", to: "go", label: { text: "Yes", fill: "FFFFFF" } }
```

A label is a string, or an object with:

- `text`: a string or paragraphs.
- `position`: `"start"`, `"middle"` (the default) or `"end"`. At the start or end, the label sits just clear of the shape there, such as `"Yes"` and `"No"` beside a decision.
- `width` and `height`: in pixels. By default the box fits the text, measured as for [`"fitText"`](#sizing-a-shape-to-its-text).
- `fill` and `line`.

A label that would sit on a shape, or on an earlier label, moves along its route until it is clear. If there is no room on the route, it goes beside it. A label is a separate text box, so Word doesn't move it when the connector moves.

### Connectors that meet

When several connectors with arrowheads meet at the same point of a shape with straight sides, their ends are spread out along the side, so each arrowhead can be seen. Connectors between the same two shapes are spread out at both ends, so they run side by side. The ends are ordered by where the connectors go, so they don't cross.

Ends without arrowheads that go to different shapes stay together, as the lines from a box in an org chart do. So do ends given as a `point`, and ends on shapes without straight sides, such as ellipses and diamonds.

Spreading works on rectangles, rounded rectangles, pictures, and the process, alternate process, predefined process, internal storage, terminator and document flowchart shapes. The ends stay attached to the shape's connection point, so if a shape is moved in Word, Word joins them there again.

The connector's `line` works as for any shape: `startArrow` is drawn at `from` and `endArrow` at `to`. Connectors can come before or after the shapes they join in `children`; the order sets which is drawn on top.

A connector attaches at one of the points Word offers on the shape, such as the middle of a rectangle's side or the tip of a triangle, so Word treats it as connected. Shapes without connection points, such as the chart shapes, are connected at the middle of a side, or at the `point` given, without being attached.

## Canvases

A `ShapeCanvasRun` is a drawing canvas: an area of the document that holds shapes, like Word's **Insert > Shapes > New Drawing Canvas**. It takes the same children as a group, but its shapes keep their own size.

Word only keeps connectors attached on a canvas. When you move a shape on a canvas in Word, its connectors follow it. In a group, connectors are drawn in the same way, but they stay where they are when a shape is moved, so use a canvas for diagrams that people will edit.

```ts
new ShapeCanvasRun({
    children: [/* shapes and connectors */],
    transformation: { width: 400, height: 300 },
    fill: "F7F7F7",
    line: "BFBFBF",
});
```

Shapes are positioned with `transformation.offset`, in pixels from the canvas's top-left corner, or by a [`layout`](#laying-out-diagrams). Without a `transformation`, the canvas reaches from its corner to the right and bottom of the shapes, including their lines, arrowheads and effects. Anything drawn above or to the left of the corner, such as the line of a shape at the corner, moves everything onto the canvas. A canvas can be `floating` and can have `altText`.

## Laying Out Diagrams

Give a canvas or group a `layout` to place its shapes for you. Shapes, pictures and groups without an `offset` are placed by the layout, and connectors are routed between them afterwards:

```ts
new ShapeCanvasRun({
    layout: { type: "flow", direction: "down" },
    children: [
        { id: "start", type: "flowChartTerminator", text: "Start", transformation: { width: 100, height: 36 } },
        { id: "review", type: "flowChartDecision", text: "Approved?", transformation: { width: "fitText", height: 70 } },
        { id: "publish", type: "flowChartProcess", text: "Publish", transformation: { width: "fitText", height: 40 } },
        { id: "fix", type: "flowChartProcess", text: "Fix it", transformation: { width: "fitText", height: 40 } },
        { type: "connector", from: "start", to: "review", line: { endArrow: "triangle" } },
        { type: "connector", from: "review", to: "publish", route: "elbow", label: { text: "Yes", position: "start" } },
        { type: "connector", from: "review", to: "fix", route: "elbow", label: { text: "No", position: "start" } },
        { type: "connector", from: "fix", to: "review", route: "elbow", line: { endArrow: "triangle" } },
    ],
});
```

| `layout.type` | Places the shapes                                                                                                                                                                       |
| ------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `"flow"`      | In levels along the connectors, like a flowchart. Each shape goes on the level after the shapes that connect to it, and each level is ordered so connectors cross as little as they can |
| `"tree"`      | As a tree, like an org chart. Each connector joins a parent (`from`) to a child (`to`), and each parent is centred over its children                                                    |
| `"grid"`      | In rows and columns, in the order they are given, each centred in its cell                                                                                                              |

| Option         | Layouts    | Description                                                                            |
| -------------- | ---------- | -------------------------------------------------------------------------------------- |
| `direction`    | flow, tree | `"down"` (the default), `"right"`, `"up"` or `"left"`: the way the levels run          |
| `spacing`      | all        | Space between shapes on the same level, or between rows and columns, in pixels         |
| `levelSpacing` | flow, tree | Space between one level and the next, in pixels                                        |
| `columns`      | grid       | The number of columns. By default, enough to make the grid about as wide as it is tall |

Spacing defaults to 40 pixels between shapes and 50 between levels in a flow, 20 and 40 in a tree, and 40 in a grid.

In a flow or tree, a connector without a `side` leaves one level from the side facing the next level and arrives from the side facing the level before, such as bottom to top when the levels run down. A connector back to the level before goes between the same sides the other way, and one that leads further back, such as a loop to redo a step, leaves and arrives at the side (right, or bottom when the levels run across) and goes around the shapes. In a flow, connectors that lead back don't change the levels.

A shape with an `offset` keeps it, and the layout places the other shapes as if it weren't there, starting at the top-left corner. A group inside a canvas or group is placed as one shape, and can have a `layout` of its own for its children. Rotated shapes are placed by the box around them.

The positions are worked out when the document is made and written as ordinary offsets, so the diagram can be edited in Word like any other.

## Options

### ShapeRun

| Property         | Type                            | Notes    | Description                                                                      |
| ---------------- | ------------------------------- | -------- | -------------------------------------------------------------------------------- |
| `type`           | `PresetShapeType` \| `"custom"` | Required | The preset shape, such as `"rectangle"`, `"ellipse"` or `"line"`, or `"custom"`  |
| `transformation` | `ShapeTransformation`           | Required | Size in pixels, rotation and flip. See [Size and Rotation](#size-and-rotation)   |
| `fill`           | `ShapeFill`                     | Optional | See [Fill](#fill). Default is no fill                                            |
| `line`           | `ShapeLine`                     | Optional | See [Line](#line). Default is a black line 1pt wide                              |
| `adjustments`    | `ShapeAdjustments<type>`        | Optional | The shape's handles, which depend on `type`. See [Adjustments](#adjustments)     |
| `path`           | `string`                        | Optional | SVG path data, for `type: "custom"`. See [Custom Shapes](#custom-shapes)         |
| `effects`        | `ShapeEffects`                  | Optional | Shadows, glow, soft edges and reflection. See [Effects](#effects)                |
| `text`           | `string`                        | Optional | Centred text inside the shape. See [Text in Shapes](#text-in-shapes)             |
| `children`       | `Paragraph[]`                   | Optional | Paragraphs inside the shape                                                      |
| `textOptions`    | `ShapeTextOptions`              | Optional | How the text is laid out. See [Text layout](#text-layout)                        |
| `floating`       | `IFloating`                     | Optional | Positions the shape on the page. See [Inline and Floating](#inline-and-floating) |
| `altText`        | `DocPropertiesOptions`          | Optional | `name`, `description` and `title` for screen readers                             |
| `link`           | `string`                        | Optional | A web address the shape opens when it is clicked                                 |
| `decorative`     | `boolean`                       | Optional | Marks the shape as decorative, so screen readers skip it                         |

### ShapeGroupRun

| Property         | Type                        | Notes    | Description                                                                                                             |
| ---------------- | --------------------------- | -------- | ----------------------------------------------------------------------------------------------------------------------- |
| `children`       | `IShapeGroupChildOptions[]` | Required | Shapes, each with the options of a `ShapeRun` except `floating`, plus an optional `id`, pictures, groups and connectors |
| `transformation` | `IMediaTransformation`      | Optional | Size in pixels, rotation and flip. Defaults to the box around the children                                              |
| `layout`         | `ShapeLayout`               | Optional | Places the children without an `offset`. See [Laying Out Diagrams](#laying-out-diagrams)                                |
| `floating`       | `IFloating`                 | Optional | Positions the group on the page                                                                                         |
| `altText`        | `DocPropertiesOptions`      | Optional | `name`, `description` and `title` for screen readers                                                                    |

### ShapeCanvasRun

| Property         | Type                                | Notes    | Description                                                                              |
| ---------------- | ----------------------------------- | -------- | ---------------------------------------------------------------------------------------- |
| `children`       | `IShapeCanvasChildOptions[]`        | Required | Shapes and connectors, as for a `ShapeGroupRun`                                          |
| `transformation` | `{ width: number; height: number }` | Optional | Size in pixels. Defaults to reaching the right and bottom of the shapes                  |
| `fill`           | `ShapeFill`                         | Optional | The canvas's background. Default is none                                                 |
| `line`           | `ShapeLine`                         | Optional | The canvas's outline. Default is none                                                    |
| `layout`         | `ShapeLayout`                       | Optional | Places the children without an `offset`. See [Laying Out Diagrams](#laying-out-diagrams) |
| `floating`       | `IFloating`                         | Optional | Positions the canvas on the page                                                         |
| `altText`        | `DocPropertiesOptions`              | Optional | `name`, `description` and `title` for screen readers                                     |

### Connector

| Property  | Type                         | Notes    | Description                                                                                    |
| --------- | ---------------------------- | -------- | ---------------------------------------------------------------------------------------------- |
| `type`    | `"connector"`                | Required |                                                                                                |
| `from`    | `ConnectorEnd`               | Required | The `id` of the shape it starts at, or `{ id, side }` or `{ id, point }`                       |
| `to`      | `ConnectorEnd`               | Required | The `id` of the shape it ends at, or `{ id, side }` or `{ id, point }`                         |
| `route`   | `ConnectorRoute`             | Optional | `"straight"`, `"elbow"` or `"curved"`. Default is straight, or elbow around a shape in the way |
| `margin`  | `number`                     | Optional | How far out elbow and curved connectors go, in pixels. Default `24`                            |
| `label`   | `string` \| `ConnectorLabel` | Optional | Text in a box on the route, at its `position`                                                  |
| `line`    | `ShapeLine`                  | Optional | See [Line](#line). `startArrow` is at `from` and `endArrow` at `to`                            |
| `altText` | `DocPropertiesOptions`       | Optional | `name`, `description` and `title` for screen readers                                           |

## ShapeRun vs WpsShapeRun and WpgGroupRun

[`WpsShapeRun`](usage/wps-text-box.md) draws a rectangular text box, and `WpgGroupRun` groups text boxes and pictures. `ShapeRun` draws any shape, with or without text, and `ShapeGroupRun` groups shapes, pictures and groups, with simpler options for fills, lines, effects and text. They write the same kinds of DrawingML elements. `WpsShapeRun` and `WpgGroupRun` are deprecated, so use `ShapeRun` and `ShapeGroupRun` from `docx/shapes` for new documents. `WpsShapeRun` and `WpgGroupRun` stay in `docx`.

## Compatibility

Shapes are written as DrawingML shapes (`wps:wsp`), groups (`wpg:wgp` and `wpg:grpSp`), pictures (`pic:pic`) and drawing canvases (`wpc:wpc`), the formats Word has used since Word 2010. Word 2007 and older can't display them. Other word processors differ in how much of DrawingML they draw, so check the result in the applications your readers use.

A canvas is written with the same shapes as a group after it, in `mc:AlternateContent`. Applications that can't draw canvases, such as Apple Pages, draw the group instead. Word and LibreOffice draw the canvas.

LibreOffice (checked with version 26.8) draws most shapes as Word does, but:

- It doesn't draw reflections, inner shadows, double and triple lines (`compound`) or gradient lines. A gradient line is drawn in its first colour.
- On a canvas, it draws connectors between their shapes' connection points in its own way, rather than on the route in the document. A connector that goes around a shape may go through it, and connector ends that are spread along a side meet at the connection point. In a group, it draws the route in the document.
- It draws the text of a shape that has `resizeShapeToFitText`, or of a group or canvas that starts a new line, on the first line of the paragraph.
- It doesn't turn the text of a rotated shape with the shape.

Apple Pages (checked with version 15.1) draws shapes and groups, and the group in place of a canvas, but:

- It draws text that has no size of its own larger than Word does. Shapes sized with `"fitText"` and connector labels are sized for Word's 10pt, so give the text a `size` if it has to fit in Pages as well.

## Examples

### Inline shapes

Bars, rules and signature lines in the flow of text, as on a printed form.

[Example](https://raw.githubusercontent.com/dolanmiu/docx/master/demo/107-inline-shapes.ts ":include")

_Source: https://github.com/dolanmiu/docx/blob/master/demo/107-inline-shapes.ts_

### Shapes, lines and arrows

Preset shapes, dashes and arrowheads, gradients, transparency, text in shapes and floating shapes.

[Example](https://raw.githubusercontent.com/dolanmiu/docx/master/demo/108-shapes.ts ":include")

_Source: https://github.com/dolanmiu/docx/blob/master/demo/108-shapes.ts_

### Shape groups

A flowchart built from a group of shapes, the same group scaled down, and a floating, rotated group.

[Example](https://raw.githubusercontent.com/dolanmiu/docx/master/demo/109-shape-groups.ts ":include")

_Source: https://github.com/dolanmiu/docx/blob/master/demo/109-shape-groups.ts_

### Connectors and canvases

A flowchart on a canvas whose connectors stay attached, straight, elbow and curved routes, and connectors on chosen sides.

[Example](https://raw.githubusercontent.com/dolanmiu/docx/master/demo/110-shape-connectors.ts ":include")

_Source: https://github.com/dolanmiu/docx/blob/master/demo/110-shape-connectors.ts_

### Shape styles

Effects, pattern and picture fills, line styles, text layout and WordArt warps, custom shapes, links and decorative shapes.

[Example](https://raw.githubusercontent.com/dolanmiu/docx/master/demo/111-shape-styles.ts ":include")

_Source: https://github.com/dolanmiu/docx/blob/master/demo/111-shape-styles.ts_

### Diagrams

Pictures and groups on a canvas, connector labels, connecting to a point on a shape, and connectors that go around shapes.

[Example](https://raw.githubusercontent.com/dolanmiu/docx/master/demo/112-shape-diagrams.ts ":include")

_Source: https://github.com/dolanmiu/docx/blob/master/demo/112-shape-diagrams.ts_

### Automatic layout

Shapes sized to fit their text, a flowchart, an org chart and a grid laid out automatically, spread and side-by-side connectors, and labels at the start of a connector.

[Example](https://raw.githubusercontent.com/dolanmiu/docx/master/demo/113-shape-layout.ts ":include")

_Source: https://github.com/dolanmiu/docx/blob/master/demo/113-shape-layout.ts_
