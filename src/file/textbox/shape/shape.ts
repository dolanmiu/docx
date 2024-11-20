import { ParagraphChild } from "@file/paragraph";
import { XmlAttributeComponent, XmlComponent } from "@file/xml-components";

import { VTextbox } from "../vml-textbox/vml-texbox";

const SHAPE_TYPE = "#_x0000_t202";

export type ShapeStyle = {
    readonly width: string;
    readonly height?: string;
    readonly margin?: string;
};

export type IShapeOptions = {
    readonly id: string;
    readonly children?: readonly ParagraphChild[];
    readonly type?: string;
    readonly style?: ShapeStyle;
};

class ShapeAttributes extends XmlAttributeComponent<{
    readonly id: string;
    readonly type?: string;
    readonly style?: string;
}> {
    protected readonly xmlKeys = { id: "id", type: "type", style: "style" };
}

export class Shape extends XmlComponent {
    public constructor({ id, children, type = SHAPE_TYPE, style }: IShapeOptions) {
        super("v:shape");
        this.root.push(
            new ShapeAttributes({
                id,
                type,
                style: this.formatShapeStyle(style),
            }),
        );
        const vTextbox = new VTextbox({ style: "mso-fit-shape-to-text:t;", children });
        this.root.push(vTextbox);
    }

    private formatShapeStyle(style?: ShapeStyle): string | undefined {
        return style
            ? Object.entries(style)
                  .map((entry: readonly string[]) => {
                      const [key, value] = entry;
                      return `${key}:${value}`;
                  })
                  .join(";")
            : undefined;
    }
}
