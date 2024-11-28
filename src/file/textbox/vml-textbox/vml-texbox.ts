// http://webapp.docx4java.org/OnlineDemo/ecma376/VML/textbox.html
import { ParagraphChild } from "@file/paragraph";
import { BuilderElement, XmlComponent } from "@file/xml-components";
import { InsetMode } from "@util/types";

import { createTextboxContent } from "../texbox-content/textbox-content";
import { LengthUnit } from "../types";

// type VMLTextboxStyle = {
//     readonly fontWeight?: "normal" | "lighter" | 100 | 200 | 300 | 400 | "bold" | "bolder" | 500 | 600 | 700 | 800 | 900;
// }

export type IVTextboxOptions = {
    readonly style?: string;
    readonly children?: readonly ParagraphChild[];
    readonly inset?: {
        readonly top: LengthUnit;
        readonly left: LengthUnit;
        readonly bottom: LengthUnit;
        readonly right: LengthUnit;
    };
};

export const createVmlTextbox = ({ style, children, inset }: IVTextboxOptions): XmlComponent =>
    new BuilderElement<{ readonly style?: string; readonly inset?: string; readonly insetMode?: InsetMode }>({
        name: "v:textbox",
        attributes: {
            style: {
                key: "style",
                value: style,
            },
            insetMode: {
                key: "insetmode",
                value: inset ? "custom" : "auto",
            },
            inset: {
                key: "inset",
                value: inset ? `${inset.left}, ${inset.top}, ${inset.right}, ${inset.bottom}` : undefined,
            },
        },
        children: [createTextboxContent({ children })],
    });
