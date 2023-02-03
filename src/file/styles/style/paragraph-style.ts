import { IParagraphStylePropertiesOptions, IRunStylePropertiesOptions, ParagraphProperties } from "@file/paragraph";
import { RunProperties } from "@file/paragraph/run/properties";
import { IStyleOptions, Style } from "./style";

export interface IBaseParagraphStyleOptions extends IStyleOptions {
    readonly paragraph?: IParagraphStylePropertiesOptions;
    readonly run?: IRunStylePropertiesOptions;
}

export interface IParagraphStyleOptions extends IBaseParagraphStyleOptions {
    readonly id: string;
    readonly name?: string;
}

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
