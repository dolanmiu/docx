import { XmlAttributeComponent } from "file/xml-components";
export interface IGraphicFrameLockAttributes {
    xmlns?: string;
    noChangeAspect?: number;
}
export declare class GraphicFrameLockAttributes extends XmlAttributeComponent<IGraphicFrameLockAttributes> {
    protected xmlKeys: {
        xmlns: string;
        noChangeAspect: string;
    };
}
