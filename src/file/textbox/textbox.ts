import { FileChild } from "@file/file-child";
import { IParagraphOptions, ParagraphProperties } from "@file/paragraph";
import { uniqueId } from "@util/convenience-functions";

import { createPictElement } from "./pict-element/pict-element";
import { VmlShapeStyle, createShape } from "./shape/shape";

type ITextboxOptions = Omit<IParagraphOptions, "style"> & {
    readonly style?: VmlShapeStyle;
};

export class Textbox extends FileChild {
    public constructor({ style, children, ...rest }: ITextboxOptions) {
        super("w:p");
        this.root.push(new ParagraphProperties(rest));

        this.root.push(
            createPictElement({
                shape: createShape({
                    children: children,
                    id: uniqueId(),
                    style: style,
                }),
            }),
        );
    }
}
