import { IDefaultStylesOptions } from "../../file/styles/factory";
import { BaseXmlComponent, ImportedXmlComponent, XmlComponent } from "../../file/xml-components";
import { StyleForCharacter, StyleForParagraph } from "./style";
import { ICharacterStyleOptions } from "./style/character-style";
import { IParagraphStyleOptions } from "./style/paragraph-style";
export interface IStylesOptions {
    readonly default?: IDefaultStylesOptions;
    readonly initialStyles?: BaseXmlComponent;
    readonly paragraphStyles?: IParagraphStyleOptions[];
    readonly characterStyles?: ICharacterStyleOptions[];
    readonly importedStyles?: (XmlComponent | StyleForParagraph | StyleForCharacter | ImportedXmlComponent)[];
}
export declare class Styles extends XmlComponent {
    constructor(options: IStylesOptions);
}
