import { XmlAttributeComponent } from "file/xml-components";

export interface IPresetGeometryAttributes {
    prst?: string;
}

export class PresetGeometryAttributes extends XmlAttributeComponent<IPresetGeometryAttributes> {
    protected xmlKeys = {
        prst: "prst",
    };
}
