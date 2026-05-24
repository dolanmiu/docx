# Text Frames

> Similar to `Text Boxes`!

!> Text Frames requires an understanding of [Paragraphs](usage/paragraph.md).

> Text frames are paragraphs of text in a document which are positioned in a separate region or frame in the document, and can be positioned with a specific size and position relative to non-frame paragraphs in the current document.

## Overview

To make a `Text Frame`, add the `frame` property on a paragraph. Frames support two positioning modes:

- **Absolute** (`type: "absolute"`) — position using exact X/Y coordinates in twips
- **Alignment** (`type: "alignment"`) — position using alignment values (left, center, right, top, bottom)

## Frame Options

| Property   | Type                          | Notes    | Description                                             |
| ---------- | ----------------------------- | -------- | ------------------------------------------------------- |
| type       | `"absolute"` \| `"alignment"` | Required | Positioning mode                                        |
| width      | `number`                      | Required | Frame width in twips                                    |
| height     | `number`                      | Required | Frame height in twips                                   |
| anchor     | `{ horizontal, vertical }`    | Required | What the frame is anchored to (see Anchor Types below)  |
| position   | `{ x, y }`                    | Required | X/Y coordinates in twips (only when `type: "absolute"`) |
| alignment  | `{ x, y }`                    | Required | Alignment values (only when `type: "alignment"`)        |
| wrap       | `FrameWrap`                   | Optional | Text wrapping behavior                                  |
| space      | `{ horizontal, vertical }`    | Optional | Spacing between frame and surrounding text in twips     |
| rule       | `HeightRule`                  | Optional | How frame height is calculated                          |
| dropCap    | `DropCapType`                 | Optional | Drop cap effect                                         |
| lines      | `number`                      | Optional | Number of lines for drop cap                            |
| anchorLock | `boolean`                     | Optional | Lock the anchor position                                |

### Anchor Types (`FrameAnchorType`)

| Value    | Description                        |
| -------- | ---------------------------------- |
| `MARGIN` | Anchor relative to the page margin |
| `PAGE`   | Anchor relative to the page edge   |
| `TEXT`   | Anchor relative to the text column |

### Wrap Types (`FrameWrap`)

| Value        | Description                             |
| ------------ | --------------------------------------- |
| `AROUND`     | Wrap text around the frame on all sides |
| `AUTO`       | Automatic wrapping based on space       |
| `NONE`       | No text wrapping                        |
| `NOT_BESIDE` | Do not allow text beside the frame      |
| `THROUGH`    | Allow text to flow through the frame    |
| `TIGHT`      | Wrap text tightly around the frame      |

### Drop Cap Types (`DropCapType`)

| Value    | Description                                 |
| -------- | ------------------------------------------- |
| `NONE`   | No drop cap effect                          |
| `DROP`   | Drop cap that drops into the paragraph text |
| `MARGIN` | Drop cap that extends into the margin       |

## Absolute Positioning

Position a frame using exact coordinates relative to the anchor:

```ts
new Paragraph({
    frame: {
        type: "absolute",
        position: {
            x: 1000,
            y: 3000,
        },
        width: 4000,
        height: 1000,
        anchor: {
            horizontal: FrameAnchorType.MARGIN,
            vertical: FrameAnchorType.MARGIN,
        },
    },
    border: {
        top: { color: "auto", space: 1, value: "single", size: 6 },
        bottom: { color: "auto", space: 1, value: "single", size: 6 },
        left: { color: "auto", space: 1, value: "single", size: 6 },
        right: { color: "auto", space: 1, value: "single", size: 6 },
    },
    children: [new TextRun("Hello World"), new TextRun({ text: "Foo Bar", bold: true })],
});
```

## Alignment Positioning

Position a frame using alignment values instead of exact coordinates:

```ts
new Paragraph({
    frame: {
        type: "alignment",
        alignment: {
            x: HorizontalPositionAlign.CENTER,
            y: VerticalPositionAlign.TOP,
        },
        width: 4000,
        height: 1000,
        anchor: {
            horizontal: FrameAnchorType.PAGE,
            vertical: FrameAnchorType.PAGE,
        },
        wrap: FrameWrap.AROUND,
    },
    children: [new TextRun("Centered at top of page")],
});
```

## Drop Cap

Create a decorative large initial letter using the `dropCap` and `lines` properties:

```ts
new Paragraph({
    frame: {
        type: "absolute",
        position: { x: 0, y: 0 },
        width: 1440,
        height: 1440,
        anchor: {
            horizontal: FrameAnchorType.TEXT,
            vertical: FrameAnchorType.TEXT,
        },
        dropCap: DropCapType.DROP,
        lines: 3,
    },
    children: [new TextRun({ text: "O", size: 72 })],
});
```

## Demo

[Example](https://raw.githubusercontent.com/dolanmiu/docx/master/demo/61-text-frame.ts ":include")

_Source: https://github.com/dolanmiu/docx/blob/master/demo/61-text-frame.ts_
