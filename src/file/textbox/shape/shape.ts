// https://c-rex.net/samples/ooxml/e1/Part3/OOXML_P3_Primer_OfficeArt_topic_ID0ELU5O.html
// http://webapp.docx4java.org/OnlineDemo/ecma376/VML/shape.html
import { ParagraphChild } from "@file/paragraph";
import { BuilderElement, XmlComponent } from "@file/xml-components";

import { LengthUnit } from "../types";
import { createVmlTextbox } from "../vml-textbox/vml-texbox";

const SHAPE_TYPE = "#_x0000_t202";

const styleToKeyMap: Record<keyof VmlShapeStyle, string> = {
    flip: "flip",
    height: "height",
    left: "left",
    marginBottom: "margin-bottom",
    marginLeft: "margin-left",
    marginRight: "margin-right",
    marginTop: "margin-top",
    positionHorizontal: "mso-position-horizontal",
    positionHorizontalRelative: "mso-position-horizontal-relative",
    positionVertical: "mso-position-vertical",
    positionVerticalRelative: "mso-position-vertical-relative",
    wrapDistanceBottom: "mso-wrap-distance-bottom",
    wrapDistanceLeft: "mso-wrap-distance-left",
    wrapDistanceRight: "mso-wrap-distance-right",
    wrapDistanceTop: "mso-wrap-distance-top",
    wrapEdited: "mso-wrap-edited",
    wrapStyle: "mso-wrap-style",
    position: "position",
    rotation: "rotation",
    top: "top",
    visibility: "visibility",
    width: "width",
    zIndex: "z-index",
};

export type VmlShapeStyle = {
    /** Specifies that the orientation of a shape is flipped. Default is no value. */
    readonly flip?: "x" | "y" | "xy" | "yx";
    /** Specifies the height of the containing block of the shape. Default is 0. It is specified in CSS units or, for elements in a group, in the coordinate system of the parent element. */
    readonly height?: LengthUnit;
    /** Specifies the position of the left of the containing block of the shape relative to the element left of it in the flow of the page. Default is 0. It is specified in CSS units or, for elements in a group, in the coordinate system of the parent element. This property shall not be used for shapes anchored inline. */
    readonly left?: LengthUnit;
    /** Specifies the position of the bottom of the containing block of the shape relative to the shape anchor. Default is 0. It is specified in CSS units or, for elements in a group, in the coordinate system of the parent element. */
    readonly marginBottom?: LengthUnit;
    /** Specifies the position of the left of the containing block of the shape relative to the shape anchor. Default is 0. It is specified in CSS units or, for elements in a group, in the coordinate system of the parent element. */
    readonly marginLeft?: LengthUnit;
    /** Specifies the position of the right of the containing block of the shape relative to the shape anchor. Default is 0. It is specified in CSS units or, for elements in a group, in the coordinate system of the parent element. */
    readonly marginRight?: LengthUnit;
    /** Specifies the position of the top of the containing block of the shape relative to the shape anchor. Default is 0. It is specified in CSS units or, for elements in a group, in the coordinate system of the parent element. */
    readonly marginTop?: LengthUnit;
    /** Specifies the horizontal positioning data for objects in WordprocessingML documents. Default is absolute. */
    readonly positionHorizontal?: "absolute" | "left" | "center" | "right" | "inside" | "outside";
    /** Specifies relative horizontal position data for objects in WordprocessingML documents. This modifies the mso-position-horizontal property. Default is text. */
    readonly positionHorizontalRelative?: "margin" | "page" | "text" | "char";
    /** Specifies the vertical positioning data for objects in WordprocessingML documents. Default is absolute. */
    readonly positionVertical?: "absolute" | "left" | "center" | "right" | "inside" | "outside";
    /** Specifies relative vertical position data for objects in WordprocessingML documents. This modifies the mso-position-vertical property. Default is text. */
    readonly positionVerticalRelative?: "margin" | "page" | "text" | "char";
    /** Specifies the distance from the bottom of the shape to the text that wraps around it. Default is 0 pt. Note that this property is different from the CSS margin property, which changes the origin of the shape to include the margin areas. This property does not change the origin. */
    readonly wrapDistanceBottom?: number;
    /** Specifies the distance from the left side of the shape to the text that wraps around it. Default is 0 pt. Note that this property is different from the CSS margin property, which changes the origin of the shape to include the margin areas. This property does not change the origin. */
    readonly wrapDistanceLeft?: number;
    /** Specifies the distance from the right side of the shape to the text that wraps around it. Default is 0 pt. Note that this property is different from the CSS margin property, which changes the origin of the shape to include the margin areas. This property does not change the origin. */
    readonly wrapDistanceRight?: number;
    /** Specifies the distance from the top of the shape to the text that wraps around it. Default is 0 pt. Note that this property is different from the CSS margin property, which changes the origin of the shape to include the margin areas. This property does not change the origin. */
    readonly wrapDistanceTop?: number;
    /** Specifies whether the wrap coordinates were customized by the user. If the wrap coordinates are generated by an editor, this property is true; otherwise they were customized by a user. Default is false. */
    readonly wrapEdited?: boolean;
    /** Specifies the wrapping mode for text in shapes in WordprocessingML documents. Default is square. */
    readonly wrapStyle?: "square" | "none";
    /** Specifies the type of positioning used to place an element. Default is static. When the element is contained inside a group, this property must be absolute. */
    readonly position?: "static" | "absolute" | "relative";
    /** Specifies the angle that a shape is rotated, in degrees. Default is 0. Positive angles are clockwise. */
    readonly rotation?: number;
    /** Specifies the position of the top of the containing block of the shape relative to the element above it in the flow of the page. Default is 0. It is specified in CSS units or, for elements in a group, in the coordinate system of the parent element. This property shall not be used for shapes anchored inline. */
    readonly top?: LengthUnit;
    /** Specifies whether a shape is displayed. Only inherit and hidden are used; any other values are mapped to inherit. Default is inherit. */
    readonly visibility?: "hidden" | "inherit";
    /** Specifies the width of the containing block of the shape. Default is 0. It is specified in CSS units or, for elements in a group, in the coordinate system of the parent element. */
    readonly width: LengthUnit;
    /** Specifies the display order of overlapping shapes. Default is 0. This property shall not be used for shapes anchored inline. */
    readonly zIndex?: "auto" | number;
};

const formatShapeStyle = (style?: VmlShapeStyle): string | undefined =>
    style
        ? Object.entries(style)
              .map(([key, value]) => `${styleToKeyMap[key as keyof VmlShapeStyle]}:${value}`)
              .join(";")
        : undefined;

type ShapeOptions = {
    readonly id: string;
    readonly children?: readonly ParagraphChild[];
    readonly type?: string;
    readonly style?: VmlShapeStyle;
};

export const createShape = ({ id, children, type = SHAPE_TYPE, style }: ShapeOptions): XmlComponent =>
    new BuilderElement<
        Pick<ShapeOptions, "id" | "type"> & {
            readonly style?: string;
        }
    >({
        name: "v:shape",
        attributes: {
            id: {
                key: "id",
                value: id,
            },
            type: {
                key: "type",
                value: type,
            },
            style: {
                key: "style",
                value: formatShapeStyle(style),
            },
        },
        children: [createVmlTextbox({ style: "mso-fit-shape-to-text:t;", children })],
    });
