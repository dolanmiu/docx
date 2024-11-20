import { FileChild } from "@file/file-child";
import { IParagraphOptions, ParagraphProperties } from "@file/paragraph";
import { uniqueId } from "@util/convenience-functions";

import { createPictElement } from "./pict-element/pict-element";
import { ShapeStyle, createShape } from "./shape/shape";

export type ITextboxOptions = {
    readonly options: IParagraphOptions;
    readonly style?: ShapeStyle;
};

export class Textbox extends FileChild {
    private readonly properties: ParagraphProperties;

    public constructor({ options, style }: ITextboxOptions) {
        super("w:p");
        this.properties = new ParagraphProperties(options);
        this.root.push(this.properties);
        const shape = createShape({
            children: options.children,
            id: uniqueId(),
            style: style,
        });
        this.root.push(
            createPictElement({
                shape,
            }),
        );
    }
}
