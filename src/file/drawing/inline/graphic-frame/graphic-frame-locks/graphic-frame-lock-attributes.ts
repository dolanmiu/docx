import { XmlAttributeComponent } from "file/xml-components";

export interface IGraphicFrameLockAttributes {
    xmlns?: string;
    noChangeAspect?: number;
}

export class GraphicFrameLockAttributes extends XmlAttributeComponent<IGraphicFrameLockAttributes> {
    protected xmlKeys = {
        xmlns: "xmlns:a",
        noChangeAspect: "noChangeAspect",
    };
}
