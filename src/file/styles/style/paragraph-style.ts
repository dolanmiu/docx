import { IParagraphStylePropertiesOptions, IRunStylePropertiesOptions, ParagraphProperties } from "@file/paragraph";
import { RunProperties } from "@file/paragraph/run/properties";

import { IStyleOptions, Style } from "./style";

export type IBaseParagraphStyleOptions = {
    readonly paragraph?: IParagraphStylePropertiesOptions;
    readonly run?: IRunStylePropertiesOptions;
} & IStyleOptions;

export type IParagraphStyleOptions = {
    readonly id: string;
} & IBaseParagraphStyleOptions;

export class StyleForParagraph extends Style {
    private readonly paragraphProperties: ParagraphProperties;
    private readonly runProperties: RunProperties;

    public constructor(options: IParagraphStyleOptions) {
        super({ type: "paragraph", styleId: options.id }, options);

        this.paragraphProperties = new ParagraphProperties(options.paragraph);
        this.runProperties = new RunProperties(options.run);

        this.root.push(this.paragraphProperties);
        this.root.push(this.runProperties);
    }
}
