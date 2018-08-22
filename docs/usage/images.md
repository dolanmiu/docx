# Images

## Intro

Adding images is very simple

Simply call the `createImage` method:

```js
const image = doc.createImage([BUFFER_OF_YOUR_IMAGE]);
```

`docx` supports `jpeg`, `jpg`, `bmp`, `gif` and `png`

Check `demo5.js` for an example

## Positioning

Images can be:

*   floating position of images
*   Wrapped around the text
*   Inline

By default, picture are exported as `INLINE` elements.

In Word this is found in:

![Word Image Positiong](https://user-images.githubusercontent.com/34742290/41765548-b0946302-7604-11e8-96f9-166a9f0b8f39.png)

### Usage

The `PictureRun` element support various options to define the positioning of the element in the document.

```js
interface DrawingOptions {
    position?: PlacementPosition;
    textWrapping?: TextWrapping;
    floating?: Floating;
}
```

can be passed when creating `PictureRun()` for example:

```js
const imageData = document.createImage(buffer, 903, 1149);

new docx.PictureRun(imageData, {
    position: docx.PlacementPosition.FLOATING,
    floating: {
        horizontalPosition: {
            relative: HorizontalPositionRelativeFrom.PAGE,
            align: HorizontalPositionAlign.LEFT,
        },
        verticalPosition: {
            relative: VerticalPositionRelativeFrom.PAGE,
            align: VerticalPositionAlign.TOP,
        },
    },
});
```

So, the first thing is to define the placement position: `INLINE` or `FLOATING`. Inline is the default one so there is no need to pass drawing options for inline.

When placement position is FLOATING then we can use two options:

### Wrap text

for `drawingOptions.textWrapping` we can define various options. `textWrapping` has the following properties:

```js
interface TextWrapping {
    textWrapStyle: TextWrapStyle;
    wrapTextOption?: WrapTextOption;
    distanceFromText?: Distance;
}

enum TextWrapStyle {
    NONE,
    SQUARE,
    TIGHT,
    TOP_AND_BOTTOM,
}

enum WrapTextOption {
    BOTH_SIDES = "bothSides",
    LEFT = "left",
    RIGHT = "right",
    LARGEST = "largest",
}
```

### Floating position

When we want to position the image relative or absolute then we need to use option `drawingOptions.floating`:

```js
export interface Floating {
    horizontalPosition: HorizontalPositionOptions;
    verticalPosition: VerticalPositionOptions;
    allowOverlap?: boolean;
    lockAnchor?: boolean;
    behindDocument?: boolean;
    layoutInCell?: boolean;
}

export interface HorizontalPositionOptions {
    relative: HorizontalPositionRelativeFrom;
    align?: HorizontalPositionAlign;
    offset?: number;
}

export interface VerticalPositionOptions {
    relative: VerticalPositionRelativeFrom;
    align?: VerticalPositionAlign;
    offset?: number;
}

export enum HorizontalPositionRelativeFrom {
    CHARACTER = "character",
    COLUMN = "column",
    INSIDE_MARGIN = "insideMargin",
    LEFT_MARGIN = "leftMargin",
    MARGIN = "margin",
    OUTSIDE_MARGIN = "outsideMargin",
    PAGE = "page",
    RIGHT_MARGIN = "rightMargin",
}

export enum VerticalPositionRelativeFrom {
    BOTTOM_MARGIN = "bottomMargin",
    INSIDE_MARGIN = "insideMargin",
    LINE = "line",
    MARGIN = "margin",
    OUTSIDE_MARGIN = "outsideMargin",
    PAGE = "page",
    PARAGRAPH = "paragraph",
    TOP_MARGIN = "topMargin",
}

export enum HorizontalPositionAlign {
    CENTER = "center",
    INSIDE = "inside",
    LEFT = "left",
    OUTSIDE = "outside",
    RIGHT = "right",
}

export enum VerticalPositionAlign {
    BOTTOM = "bottom",
    CENTER = "center",
    INSIDE = "inside",
    OUTSIDE = "outside",
    TOP = "top",
}
```
