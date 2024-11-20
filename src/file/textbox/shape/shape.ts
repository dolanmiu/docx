import { ParagraphChild } from "@file/paragraph";
import { BuilderElement, XmlComponent } from "@file/xml-components";

import { createVmlTextbox } from "../vml-textbox/vml-texbox";

const SHAPE_TYPE = "#_x0000_t202";

export type ShapeStyle = {
    readonly width: string;
    readonly height?: string;
    readonly margin?: string;
};

const formatShapeStyle = (style?: ShapeStyle): string | undefined =>
    style
        ? Object.entries(style)
              .map((entry: readonly string[]) => {
                  const [key, value] = entry;
                  return `${key}:${value}`;
              })
              .join(";")
        : undefined;

export const createShape = ({
    id,
    children,
    type = SHAPE_TYPE,
    style,
}: {
    readonly id: string;
    readonly children?: readonly ParagraphChild[];
    readonly type?: string;
    readonly style?: ShapeStyle;
}): XmlComponent =>
    new BuilderElement<{
        readonly id: string;
        readonly type?: string;
        readonly style?: string;
    }>({
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
