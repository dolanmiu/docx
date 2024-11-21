// Documentation: http://webapp.docx4java.org/OnlineDemo/ecma376/VML/textbox.html
import { ParagraphChild } from "@file/paragraph";
import { BuilderElement, XmlComponent } from "@file/xml-components";

import { createTextboxContent } from "../texbox-content/textbox-content";

export type IVTextboxOptions = {
    readonly style?: string;
    readonly children?: readonly ParagraphChild[];
};

export const createVmlTextbox = ({ style, children }: IVTextboxOptions): XmlComponent =>
    new BuilderElement<{ readonly style?: string }>({
        name: "v:textbox",
        attributes: {
            style: {
                key: "style",
                value: style,
            },
        },
        children: [createTextboxContent({ children })],
    });
