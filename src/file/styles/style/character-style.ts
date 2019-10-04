import * as formatting from "file/paragraph/run/formatting";
import { RunProperties } from "file/paragraph/run/properties";
import { UnderlineType } from "file/paragraph/run/underline";

import { BasedOn, Link, SemiHidden, UiPriority, UnhideWhenUsed } from "./components";
import { Style } from "./style";

export interface IBaseCharacterStyleOptions {
    readonly basedOn?: string;
    readonly link?: string;
    readonly semiHidden?: boolean;
    readonly run?: {
        readonly size?: number;
        readonly bold?: boolean;
        readonly italics?: boolean;
        readonly smallCaps?: boolean;
        readonly allCaps?: boolean;
        readonly strike?: boolean;
        readonly doubleStrike?: boolean;
        readonly subScript?: boolean;
        readonly superScript?: boolean;
        readonly underline?: {
            readonly type?: UnderlineType;
            readonly color?: string;
        };
        readonly color?: string;
        readonly font?: string;
        readonly characterSpacing?: number;
        readonly highlight?: string;
        readonly shadow?: {
            readonly type: string;
            readonly fill: string;
            readonly color: string;
        };
    };
}

export interface ICharacterStyleOptions extends IBaseCharacterStyleOptions {
    readonly id: string;
    readonly name?: string;
}

export class CharacterStyle extends Style {
    private readonly runProperties: RunProperties;

    constructor(options: ICharacterStyleOptions) {
        super({ type: "character", styleId: options.id }, options.name);
        this.runProperties = new RunProperties();
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

        if (options.run) {
            if (options.run.size) {
                this.runProperties.push(new formatting.Size(options.run.size));
                this.runProperties.push(new formatting.SizeComplexScript(options.run.size));
            }

            if (options.run.bold) {
                this.runProperties.push(new formatting.Bold());
            }

            if (options.run.italics) {
                this.runProperties.push(new formatting.Italics());
            }

            if (options.run.smallCaps) {
                this.runProperties.push(new formatting.SmallCaps());
            }

            if (options.run.allCaps) {
                this.runProperties.push(new formatting.Caps());
            }

            if (options.run.strike) {
                this.runProperties.push(new formatting.Strike());
            }

            if (options.run.doubleStrike) {
                this.runProperties.push(new formatting.DoubleStrike());
            }

            if (options.run.subScript) {
                this.runProperties.push(new formatting.SubScript());
            }

            if (options.run.superScript) {
                this.runProperties.push(new formatting.SuperScript());
            }

            if (options.run.underline) {
                this.runProperties.push(new formatting.Underline(options.run.underline.type, options.run.underline.color));
            }

            if (options.run.color) {
                this.runProperties.push(new formatting.Color(options.run.color));
            }

            if (options.run.font) {
                this.runProperties.push(new formatting.RunFonts(options.run.font));
            }

            if (options.run.characterSpacing) {
                this.runProperties.push(new formatting.CharacterSpacing(options.run.characterSpacing));
            }

            if (options.run.highlight) {
                this.runProperties.push(new formatting.Highlight(options.run.highlight));
            }

            if (options.run.shadow) {
                this.runProperties.push(new formatting.Shading(options.run.shadow.type, options.run.shadow.fill, options.run.shadow.color));
            }
        }
    }
}
