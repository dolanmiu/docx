import { FileChild } from "@file/file-child";
import { IParagraphOptions, ParagraphProperties } from "@file/paragraph";
import { Pict } from "./pict/pict";
import { Shape } from "./shape/shape";

export type ITextboxOptions = IParagraphOptions;

export class Textbox extends FileChild {
    private readonly properties: ParagraphProperties;

    public constructor(options: ITextboxOptions) {
        super("w:p");
        this.properties = new ParagraphProperties(options);
        this.root.push(this.properties);
        if (options.children) {
            const shape = new Shape({
                children: options.children,
                id: "TextBox1",
                type: "#_x0000_t202",
                style: "width:100%; height:auto; margin-left:0;",
            });
            this.root.push(
                new Pict({
                    shape,
                }),
            );
        }
    }
}
