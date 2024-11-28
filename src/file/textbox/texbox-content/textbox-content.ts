import { ParagraphChild } from "@file/paragraph";
import { BuilderElement, XmlComponent } from "@file/xml-components";

export const createTextboxContent = ({ children = [] }: { readonly children?: readonly ParagraphChild[] }): XmlComponent =>
    new BuilderElement<{ readonly style?: string }>({
        name: "w:txbxContent",
        children: children as readonly XmlComponent[],
    });
