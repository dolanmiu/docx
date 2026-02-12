// http://officeopenxml.com/drwPicFloating-textWrap.php
import { BuilderElement, XmlComponent } from "@file/xml-components";

export const createWrapNone = (): XmlComponent =>
    new BuilderElement({
        name: "wp:wrapNone",
    });
