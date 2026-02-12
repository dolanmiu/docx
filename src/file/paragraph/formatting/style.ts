import { BuilderElement, XmlComponent } from "@file/xml-components";

export const HeadingLevel = {
    HEADING_1: "Heading1",
    HEADING_2: "Heading2",
    HEADING_3: "Heading3",
    HEADING_4: "Heading4",
    HEADING_5: "Heading5",
    HEADING_6: "Heading6",
    TITLE: "Title",
} as const;

export const createParagraphStyle = (styleId: string): XmlComponent =>
    new BuilderElement<{ readonly val: string }>({
        name: "w:pStyle",
        attributes: {
            val: { key: "w:val", value: styleId },
        },
    });
