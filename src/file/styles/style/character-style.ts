import { IRunStylePropertiesOptions, RunProperties } from "@file/paragraph/run/properties";

import { IStyleOptions, Style } from "./style";

export interface IBaseCharacterStyleOptions extends IStyleOptions {
    readonly run?: IRunStylePropertiesOptions;
}

export interface ICharacterStyleOptions extends IBaseCharacterStyleOptions {
    readonly id: string;
    readonly name?: string;
}

export class StyleForCharacter extends Style {
    private readonly runProperties: RunProperties;

    public constructor(options: ICharacterStyleOptions) {
        super(
            { type: "character", styleId: options.id },
            {
                uiPriority: 99,
                unhideWhenUsed: true,
                ...options,
            },
        );

        this.runProperties = new RunProperties(options.run);
        this.root.push(this.runProperties);
    }
}
