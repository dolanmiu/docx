// http://officeopenxml.com/WPparagraph.php
import { BuilderElement, XmlComponent } from "@file/xml-components";

export const createOutlineLevel = (level: number): XmlComponent =>
    new BuilderElement<{ readonly val: number }>({
        name: "w:outlineLvl",
        attributes: {
            val: { key: "w:val", value: level },
        },
    });
