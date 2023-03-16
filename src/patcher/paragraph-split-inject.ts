import { Element } from "xml-js";
import { createTextElementContents, patchSpaceAttribute } from "./util";

export const findRunElementIndexWithToken = (paragraphElement: Element, token: string): number => {
    for (let i = 0; i < (paragraphElement.elements ?? []).length; i++) {
        const element = paragraphElement.elements![i];
        if (element.type === "element" && element.name === "w:r") {
            const textElement = (element.elements ?? []).filter((e) => e.type === "element" && e.name === "w:t");

            for (const text of textElement) {
                if ((text.elements?.[0].text as string)?.includes(token)) {
                    return i;
                }
            }
        }
    }

    throw new Error("Token not found");
};

export const splitRunElement = (runElement: Element, token: string): { readonly left: Element; readonly right: Element } => {
    let splitIndex = 0;

    const splitElements =
        runElement.elements
            ?.map((e, i) => {
                if (e.type === "element" && e.name === "w:t") {
                    const text = (e.elements?.[0].text as string) ?? "";
                    const splitText = text.split(token);
                    const newElements = splitText.map((t) => ({
                        ...e,
                        ...patchSpaceAttribute(e),
                        elements: createTextElementContents(t),
                    }));
                    splitIndex = i;
                    return newElements;
                } else {
                    return e;
                }
            })
            .flat() ?? [];

    const leftRunElement: Element = {
        ...JSON.parse(JSON.stringify(runElement)),
        elements: splitElements.slice(0, splitIndex + 1),
    };

    const rightRunElement: Element = {
        ...JSON.parse(JSON.stringify(runElement)),
        elements: splitElements.slice(splitIndex + 1),
    };

    return { left: leftRunElement, right: rightRunElement };
};
