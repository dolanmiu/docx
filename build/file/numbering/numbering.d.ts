import { IContext, IXmlableObject, XmlComponent } from "../../file/xml-components";
import { ILevelsOptions } from "./level";
import { ConcreteNumbering } from "./num";
export interface INumberingOptions {
    readonly config: {
        readonly levels: ILevelsOptions[];
        readonly reference: string;
    }[];
}
export declare class Numbering extends XmlComponent {
    private nextId;
    private readonly abstractNumberingMap;
    private readonly concreteNumberingMap;
    private readonly referenceConfigMap;
    constructor(options: INumberingOptions);
    prepForXml(context: IContext): IXmlableObject | undefined;
    createConcreteNumberingInstance(reference: string, instance: number): void;
    get ConcreteNumbering(): ConcreteNumbering[];
    get ReferenceConfig(): object[];
}
