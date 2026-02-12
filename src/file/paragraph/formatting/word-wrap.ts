// http://officeopenxml.com/WPalignment.php
// http://officeopenxml.com/WPtableAlignment.php
import { BuilderElement, XmlComponent } from "@file/xml-components";

export const createWordWrap = (): XmlComponent =>
    new BuilderElement<{ readonly val: 0 }>({
        name: "w:wordWrap",
        attributes: {
            val: { key: "w:val", value: 0 },
        },
    });
