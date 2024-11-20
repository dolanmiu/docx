import { IRunStylePropertiesOptions, RunProperties } from "@file/paragraph/run/properties";

import { IStyleOptions, Style } from "./style";

export type IBaseCharacterStyleOptions = {
    readonly run?: IRunStylePropertiesOptions;
} & IStyleOptions;

export type ICharacterStyleOptions = {
    readonly id: string;
} & IBaseCharacterStyleOptions;

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
