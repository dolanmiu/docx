// http://www.datypic.com/sc/ooxml/e-m_sSubPr-1.html
import { BuilderElement, XmlComponent } from "@file/xml-components";

export const createMathSubScriptProperties = (): XmlComponent =>
    new BuilderElement({
        name: "m:sSubPr",
    });
