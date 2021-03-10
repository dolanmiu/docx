import { IParagraphStylePropertiesOptions, IRunStylePropertiesOptions, ParagraphProperties } from "file/paragraph";
import { RunProperties } from "file/paragraph/run/properties";

import { BasedOn, Link, Next, QuickFormat, SemiHidden, UiPriority, UnhideWhenUsed } from "./components";
import { Style } from "./style";

export interface IBaseParagraphStyleOptions {
    readonly basedOn?: string;
    readonly next?: string;
    readonly quickFormat?: boolean;
    readonly link?: string;
    readonly semiHidden?: boolean;
    readonly uiPriority?: number;
    readonly unhideWhenUsed?: boolean;
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

    constructor(options: IParagraphStyleOptions) {
        super({ type: "paragraph", styleId: options.id }, options.name);

        this.paragraphProperties = new ParagraphProperties(options.paragraph);
        this.runProperties = new RunProperties(options.run);

        this.root.push(this.paragraphProperties);
        this.root.push(this.runProperties);

        if (options.basedOn) {
            this.root.push(new BasedOn(options.basedOn));
        }

        if (options.next) {
            this.root.push(new Next(options.next));
        }

        if (options.quickFormat) {
            this.root.push(new QuickFormat());
        }

        if (options.link) {
            this.root.push(new Link(options.link));
        }

        if (options.semiHidden) {
            this.root.push(new SemiHidden());
        }

        if (options.uiPriority) {
            this.root.push(new UiPriority(options.uiPriority));
        }

        if (options.unhideWhenUsed) {
            this.root.push(new UnhideWhenUsed());
        }
    }
}
