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
| Put text in a coloured box, circle or callout | Any shape with `children`                    | Flowchart step, speech bubble |
| Place a shape anywhere on the page            | `floating`                                   | Stamp in a corner             |
| Keep several shapes together as one drawing   | `ShapeGroupRun`                              | Badge, simple diagram         |
| Join shapes with lines that follow them       | `ShapeCanvasRun` with connectors             | Flowchart, org chart          |
| Crop a photo to a circle                      | `ellipse` with a picture `fill`              | Profile picture               |
| Add a shadow, glow or reflection              | `effects`                                    | Card with a drop shadow       |
| Draw a shape that isn't a preset              | `type: "custom"` with an SVG `path`          | Logo, badge, freeform outline |

## Basic Usage

```ts
import { Document, Packer, Paragraph, ShapeRun, TextRun } from "docx";

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

| Property   | Type                                           | Notes    | Description                                         |
| ---------- | ---------------------------------------------- | -------- | --------------------------------------------------- |
| `width`    | `number`                                       | Required | Width in pixels                                     |
| `height`   | `number`                                       | Required | Height in pixels                                    |
| `rotation` | `number`                                       | Optional | Clockwise rotation in degrees                       |
| `flip`     | `{ horizontal?: boolean; vertical?: boolean }` | Optional | Mirrors the shape                                   |
| `offset`   | `{ left?: number; top?: number }`              | Optional | Position in pixels. Only used for shapes in a group |

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

Add paragraphs to `children` to put text inside a shape. The text is centred vertically. Use the paragraph's `alignment` to centre it horizontally.

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

`label` puts text on a connector, in a box centred on the middle of its route. Give a background `fill` to hide the line behind the text:

```ts
{ type: "connector", from: "ask", to: "go", label: { text: "Yes", fill: "FFFFFF" } }
```

A label is a string, or an object with `text` (a string or paragraphs), and optional `width` and `height` in pixels, `fill` and `line`. It is a separate text box, so Word doesn't move it when the connector moves.

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

Shapes are positioned with `transformation.offset`, in pixels from the canvas's top-left corner. Without a `transformation`, the canvas reaches from its corner to the right and bottom of the shapes, including their lines, arrowheads and effects. Anything drawn above or to the left of the corner, such as the line of a shape at the corner, moves everything onto the canvas. A canvas can be `floating` and can have `altText`.

## Options

### ShapeRun

| Property         | Type                            | Notes    | Description                                                                      |
| ---------------- | ------------------------------- | -------- | -------------------------------------------------------------------------------- |
| `type`           | `PresetShapeType` \| `"custom"` | Required | The preset shape, such as `"rectangle"`, `"ellipse"` or `"line"`, or `"custom"`  |
| `transformation` | `IMediaTransformation`          | Required | Size in pixels, rotation and flip. See [Size and Rotation](#size-and-rotation)   |
| `fill`           | `ShapeFill`                     | Optional | See [Fill](#fill). Default is no fill                                            |
| `line`           | `ShapeLine`                     | Optional | See [Line](#line). Default is a black line 1pt wide                              |
| `adjustments`    | `ShapeAdjustments<type>`        | Optional | The shape's handles, which depend on `type`. See [Adjustments](#adjustments)     |
| `path`           | `string`                        | Optional | SVG path data, for `type: "custom"`. See [Custom Shapes](#custom-shapes)         |
| `effects`        | `ShapeEffects`                  | Optional | Shadows, glow, soft edges and reflection. See [Effects](#effects)                |
| `children`       | `Paragraph[]`                   | Optional | Text inside the shape                                                            |
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
| `floating`       | `IFloating`                 | Optional | Positions the group on the page                                                                                         |
| `altText`        | `DocPropertiesOptions`      | Optional | `name`, `description` and `title` for screen readers                                                                    |

### ShapeCanvasRun

| Property         | Type                                | Notes    | Description                                                             |
| ---------------- | ----------------------------------- | -------- | ----------------------------------------------------------------------- |
| `children`       | `IShapeCanvasChildOptions[]`        | Required | Shapes and connectors, as for a `ShapeGroupRun`                         |
| `transformation` | `{ width: number; height: number }` | Optional | Size in pixels. Defaults to reaching the right and bottom of the shapes |
| `fill`           | `ShapeFill`                         | Optional | The canvas's background. Default is none                                |
| `line`           | `ShapeLine`                         | Optional | The canvas's outline. Default is none                                   |
| `floating`       | `IFloating`                         | Optional | Positions the canvas on the page                                        |
| `altText`        | `DocPropertiesOptions`              | Optional | `name`, `description` and `title` for screen readers                    |

### Connector

| Property  | Type                         | Notes    | Description                                                              |
| --------- | ---------------------------- | -------- | ------------------------------------------------------------------------ |
| `type`    | `"connector"`                | Required |                                                                          |
| `from`    | `ConnectorEnd`               | Required | The `id` of the shape it starts at, or `{ id, side }` or `{ id, point }` |
| `to`      | `ConnectorEnd`               | Required | The `id` of the shape it ends at, or `{ id, side }` or `{ id, point }`   |
| `route`   | `ConnectorRoute`             | Optional | `"straight"` (the default), `"elbow"` or `"curved"`                      |
| `margin`  | `number`                     | Optional | How far out elbow and curved connectors go, in pixels. Default `24`      |
| `label`   | `string` \| `ConnectorLabel` | Optional | Text in a box on the middle of the route                                 |
| `line`    | `ShapeLine`                  | Optional | See [Line](#line). `startArrow` is at `from` and `endArrow` at `to`      |
| `altText` | `DocPropertiesOptions`       | Optional | `name`, `description` and `title` for screen readers                     |

## ShapeRun vs WpsShapeRun and WpgGroupRun

[`WpsShapeRun`](usage/wps-text-box.md) draws a rectangular text box, and `WpgGroupRun` groups text boxes and pictures. `ShapeRun` draws any shape, with or without text, and `ShapeGroupRun` groups shapes, pictures and groups, with simpler options for fills, lines, effects and text. They write the same kinds of DrawingML elements. `WpsShapeRun` and `WpgGroupRun` are deprecated, so use `ShapeRun` and `ShapeGroupRun` for new documents.

## Compatibility

Shapes are written as DrawingML shapes (`wps:wsp`), groups (`wpg:wgp` and `wpg:grpSp`), pictures (`pic:pic`) and drawing canvases (`wpc:wpc`), the formats Word has used since Word 2010. Word 2007 and older can't display them. Other word processors differ in how much of DrawingML they draw, so check the result in the applications your readers use.

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
