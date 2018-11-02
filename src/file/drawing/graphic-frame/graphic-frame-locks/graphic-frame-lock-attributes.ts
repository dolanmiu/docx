import { XmlAttributeComponent } from "file/xml-components";

export interface IGraphicFrameLockAttributes {
    readonly xmlns?: string;
    readonly noChangeAspect?: number;
}

export class GraphicFrameLockAttributes extends XmlAttributeComponent<IGraphicFrameLockAttributes> {
    protected readonly xmlKeys = {
        xmlns: "xmlns:a",
        noChangeAspect: "noChangeAspect",
    };
}
