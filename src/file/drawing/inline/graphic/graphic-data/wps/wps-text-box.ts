import type { Paragraph } from "@file/paragraph";
import { BuilderElement, type XmlComponent } from "@file/xml-components";

import { createTextBoxContent } from "./text-box-content";

export const createWpsTextBox = (children: readonly Paragraph[]): XmlComponent =>
    new BuilderElement({
        name: "wps:txbx",
        children: [createTextBoxContent(children)],
    });
