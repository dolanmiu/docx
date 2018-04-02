import { XmlAttributeComponent } from "../../../../../file/xml-components";
export interface IGraphicDataAttributes {
    uri?: string;
}
export declare class GraphicDataAttributes extends XmlAttributeComponent<IGraphicDataAttributes> {
    protected xmlKeys: {
        uri: string;
    };
}
