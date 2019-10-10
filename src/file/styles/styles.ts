import { BaseXmlComponent, ImportedXmlComponent, XmlComponent } from "file/xml-components";

import { CharacterStyle, ParagraphStyle } from "./style";
import { ICharacterStyleOptions } from "./style/character-style";
import { IParagraphStyleOptions } from "./style/paragraph-style";
export * from "./border";

export interface IStylesOptions {
    readonly initialStyles?: BaseXmlComponent;
    readonly paragraphStyles?: IParagraphStyleOptions[];
    readonly characterStyles?: ICharacterStyleOptions[];
    readonly importedStyles?: Array<XmlComponent | ParagraphStyle | CharacterStyle | ImportedXmlComponent>;
}

export class Styles extends XmlComponent {
    constructor(options: IStylesOptions) {
        super("w:styles");

        if (options.initialStyles) {
            this.root.push(options.initialStyles);
        }

        if (options.importedStyles) {
            for (const style of options.importedStyles) {
                this.root.push(style);
            }
        }

        if (options.paragraphStyles) {
            for (const style of options.paragraphStyles) {
                this.root.push(new ParagraphStyle(style));
            }
        }

        if (options.characterStyles) {
            for (const style of options.characterStyles) {
                this.root.push(new CharacterStyle(style));
            }
        }
    }
}
