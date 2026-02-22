import type { Paragraph } from "@file/paragraph";
import { BuilderElement, type XmlComponent } from "@file/xml-components";

export const createTextBoxContent = (children: readonly Paragraph[]): XmlComponent =>
    new BuilderElement({
        name: "w:txbxContent",
        children: [...children],
    });
