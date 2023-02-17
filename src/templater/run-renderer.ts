import { Element } from "xml-js";

export interface IRenderedParagraphNode {
    readonly text: string;
    readonly runs: readonly IRenderedRunNode[];
}

interface IParts {
    readonly text: string;
    readonly index: number;
}

export interface IRenderedRunNode {
    readonly text: string;
    readonly parts: readonly IParts[];
    readonly index: number;
}

export const renderParagraphNode = (node: Element): IRenderedParagraphNode => {
    if (node.name !== "w:p") {
        throw new Error(`Invalid node type: ${node.name}`);
    }

    if (!node.elements) {
        return {
            text: "",
            runs: [],
        };
    }

    const runs = node.elements
        .map((element, i) => ({ element, i }))
        .filter(({ element }) => element.name === "w:r")
        .map(({ element, i }) => renderRunNode(element, i))
        .filter((e) => !!e)
        .map((e) => e as IRenderedRunNode);

    const text = runs.reduce((acc, curr) => acc + curr.text, "");

    return {
        text,
        runs,
    };
};

const renderRunNode = (node: Element, index: number): IRenderedRunNode => {
    if (node.name !== "w:r") {
        throw new Error(`Invalid node type: ${node.name}`);
    }

    if (!node.elements) {
        return {
            text: "",
            parts: [],
            index: -1,
        };
    }

    const parts = node.elements
        .map((element, i: number) =>
            element.name === "w:t" && element.elements
                ? {
                      text: element.elements[0].text?.toString() ?? "",
                      index: i,
                  }
                : undefined,
        )
        .filter((e) => !!e)
        .map((e) => e as IParts);

    const text = parts.reduce((acc, curr) => acc + curr.text, "");

    return {
        text,
        parts,
        index,
    };
};
