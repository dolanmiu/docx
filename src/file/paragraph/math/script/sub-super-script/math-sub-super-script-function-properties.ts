// http://www.datypic.com/sc/ooxml/e-m_sSubSupPr-1.html
import { BuilderElement, XmlComponent } from "@file/xml-components";

export const createMathSubSuperScriptProperties = (): XmlComponent =>
    new BuilderElement({
        name: "m:sSubSupPr",
    });
