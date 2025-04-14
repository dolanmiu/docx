// http://www.datypic.com/sc/ooxml/e-m_subHide-1.html
import { BuilderElement, XmlComponent } from "@file/xml-components";

export const createMathSuperScriptHide = (): XmlComponent =>
    new BuilderElement<{ readonly hide: number }>({
        name: "m:supHide",
        attributes: {
            hide: { key: "m:val", value: 1 },
        },
    });
