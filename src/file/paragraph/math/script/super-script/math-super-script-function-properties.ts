// http://www.datypic.com/sc/ooxml/e-m_sSupPr-1.html
import { BuilderElement, XmlComponent } from "@file/xml-components";

export const createMathSuperScriptProperties = (): XmlComponent =>
    new BuilderElement({
        name: "m:sSupPr",
    });
