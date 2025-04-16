// http://www.datypic.com/sc/ooxml/e-m_sPrePr-1.html
import { BuilderElement, XmlComponent } from "@file/xml-components";

export const createMathPreSubSuperScriptProperties = (): XmlComponent =>
    new BuilderElement({
        name: "m:sPrePr",
    });
