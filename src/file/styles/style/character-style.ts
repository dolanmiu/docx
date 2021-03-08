import { IRunStylePropertiesOptions, RunProperties } from "file/paragraph/run/properties";

import { BasedOn, Link, SemiHidden, UiPriority, UnhideWhenUsed } from "./components";
import { Style } from "./style";

export interface IBaseCharacterStyleOptions {
    readonly basedOn?: string;
    readonly link?: string;
    readonly semiHidden?: boolean;
    readonly run?: IRunStylePropertiesOptions;
}

export interface ICharacterStyleOptions extends IBaseCharacterStyleOptions {
    readonly id: string;
    readonly name?: string;
}

export class StyleForCharacter extends Style {
    private readonly runProperties: RunProperties;

    constructor(options: ICharacterStyleOptions) {
        super({ type: "character", styleId: options.id }, options.name);

        this.runProperties = new RunProperties(options.run);

        this.root.push(this.runProperties);
        this.root.push(new UiPriority(99));
        this.root.push(new UnhideWhenUsed());

        if (options.basedOn) {
            this.root.push(new BasedOn(options.basedOn));
        }

        if (options.link) {
            this.root.push(new Link(options.link));
        }

        if (options.semiHidden) {
            this.root.push(new SemiHidden());
        }
    }
}
