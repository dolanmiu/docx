# Shapes

!> Shapes require an understanding of [Paragraphs](usage/paragraph.md).

Shapes are drawings made from lines and fills rather than pictures: rectangles, ellipses, lines, arrows, stars, callouts, flowchart symbols and more. Use a `ShapeRun` for one shape and a `ShapeGroupRun` for several shapes that belong together.

Like an image, a shape is a run inside a `Paragraph`. It sits in the line of text unless you make it `floating`.

## Common Use Cases

| I want to...                                  | Use                                          | Example                          |
| --------------------------------------------- | -------------------------------------------- | -------------------------------- |
| Draw a bar or blank line in a sentence        | `rectangle` with a `fill` and `line: "none"` | Blanks on a printed form         |
| Draw a line to write or sign on               | `line` with `height: 0`                      | Signature line                   |
| Point at something                            | `line` with an arrowhead                     | Arrow in a diagram               |
| Put text in a coloured box, circle or callout | Any shape with `children`                    | Flowchart step, speech bubble    |
| Place a shape anywhere on the page            | `floating`                                   | Stamp in a corner                |
| Keep several shapes together as one drawing   | `ShapeGroupRun`                              | Flowchart, badge, simple diagram |

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

`fill` can be a colour, `"none"`, a solid fill or a gradient. Colours are 6-digit hex values, with or without a `#`.

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

| Property       | Type        | Notes    | Description                                         |
| -------------- | ----------- | -------- | --------------------------------------------------- |
| `color`        | `string`    | Optional | 6-digit hex colour. Default is `000000` (black)     |
| `width`        | `number`    | Optional | Width in points, from `0` to `1584`. Default is `1` |
| `transparency` | `number`    | Optional | From `0` (opaque) to `100` (invisible)              |
| `dash`         | `LineDash`  | Optional | Dash pattern. Default is a solid line               |
| `startArrow`   | `Arrowhead` | Optional | Arrowhead at the start of the line                  |
| `endArrow`     | `Arrowhead` | Optional | Arrowhead at the end of the line                    |

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

`bodyProperties` controls where the text sits, as for [WPS Text Boxes](usage/wps-text-box.md#body-properties):

```ts
new ShapeRun({
    type: "rectangle",
    transformation: { width: 200, height: 100 },
    children: [new Paragraph("Top left")],
    bodyProperties: {
        verticalAnchor: VerticalAnchor.TOP,
        margins: { top: 45720, bottom: 45720, left: 91440, right: 91440 }, // EMUs
    },
});
```

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

?> Use `TextWrappingType.SQUARE` or `TextWrappingType.TOP_AND_BOTTOM` to wrap text around a shape.

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
        { type: "flowChartTerminator", transformation: { width: 100, height: 44 }, fill: "4472C4", line: "none" },
        {
            type: "straightConnector",
            transformation: { offset: { left: 100, top: 22 }, width: 30, height: 0 },
            line: { endArrow: "triangle" },
        },
        { type: "flowChartProcess", transformation: { offset: { left: 130 }, width: 110, height: 44 }, fill: "ED7D31", line: "none" },
    ],
});
```

The group is as big as the box around its shapes. Give it a `transformation` to scale every shape in it to a different size, or to rotate or flip them together:

```ts
new ShapeGroupRun({
    children: [/* ... */],
    transformation: { width: 120, height: 22 }, // half the size
});
```

A group can be `floating`, and can have `altText`, just like a single shape.

## Options

### ShapeRun

| Property         | Type                     | Notes    | Description                                                                      |
| ---------------- | ------------------------ | -------- | -------------------------------------------------------------------------------- |
| `type`           | `PresetShapeType`        | Required | The preset shape, such as `"rectangle"`, `"ellipse"` or `"line"`                 |
| `transformation` | `IMediaTransformation`   | Required | Size in pixels, rotation and flip. See [Size and Rotation](#size-and-rotation)   |
| `fill`           | `ShapeFill`              | Optional | See [Fill](#fill). Default is no fill                                            |
| `line`           | `ShapeLine`              | Optional | See [Line](#line). Default is a black line 1pt wide                              |
| `adjustments`    | `ShapeAdjustments<type>` | Optional | The shape's handles, which depend on `type`. See [Adjustments](#adjustments)     |
| `children`       | `Paragraph[]`            | Optional | Text inside the shape                                                            |
| `bodyProperties` | `IBodyPropertiesOptions` | Optional | Where the text sits in the shape                                                 |
| `floating`       | `IFloating`              | Optional | Positions the shape on the page. See [Inline and Floating](#inline-and-floating) |
| `altText`        | `DocPropertiesOptions`   | Optional | `name`, `description` and `title` for screen readers                             |

### ShapeGroupRun

| Property         | Type                        | Notes    | Description                                                                |
| ---------------- | --------------------------- | -------- | -------------------------------------------------------------------------- |
| `children`       | `IShapeGroupChildOptions[]` | Required | The shapes, each with the options of a `ShapeRun` except `floating`        |
| `transformation` | `IMediaTransformation`      | Optional | Size in pixels, rotation and flip. Defaults to the box around the children |
| `floating`       | `IFloating`                 | Optional | Positions the group on the page                                            |
| `altText`        | `DocPropertiesOptions`      | Optional | `name`, `description` and `title` for screen readers                       |

## ShapeRun vs WpsShapeRun

[`WpsShapeRun`](usage/wps-text-box.md) draws a rectangular text box. `ShapeRun` draws any preset shape, with or without text, and has simpler options for fills and lines. Both write the same kind of DrawingML shape, so prefer `ShapeRun` for new documents.

## Compatibility

Shapes are written as DrawingML shapes (`wps:wsp`), the format Word has used since Word 2010. Word 2007 and older can't display them. Other word processors differ in how much of DrawingML they draw, so check the result in the applications your readers use.

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
