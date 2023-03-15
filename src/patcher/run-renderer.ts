import { Element } from "xml-js";

import { ElementWrapper } from "./traverser";

export interface IRenderedParagraphNode {
    readonly text: string;
    readonly runs: readonly IRenderedRunNode[];
    readonly index: number;
    readonly path: readonly number[];
}

interface StartAndEnd {
    readonly start: number;
    readonly end: number;
}

type IParts = {
    readonly text: string;
    readonly index: number;
} & StartAndEnd;

export type IRenderedRunNode = {
    readonly text: string;
    readonly parts: readonly IParts[];
    readonly index: number;
} & StartAndEnd;

export const renderParagraphNode = (node: ElementWrapper): IRenderedParagraphNode => {
    if (node.element.name !== "w:p") {
        throw new Error(`Invalid node type: ${node.element.name}`);
    }

    if (!node.element.elements) {
        return {
            text: "",
            runs: [],
            index: -1,
            path: [],
        };
    }

    let currentRunStringLength = 0;

    const runs = node.element.elements
        .map((element, i) => ({ element, i }))
        .filter(({ element }) => element.name === "w:r")
        .map(({ element, i }) => {
            const renderedRunNode = renderRunNode(element, i, currentRunStringLength);
            currentRunStringLength += renderedRunNode.text.length;

            return renderedRunNode;
        })
        .filter((e) => !!e)
        .map((e) => e as IRenderedRunNode);

    const text = runs.reduce((acc, curr) => acc + curr.text, "");

    return {
        text,
        runs,
        index: node.index,
        path: buildNodePath(node),
    };
};

const renderRunNode = (node: Element, index: number, currentRunStringIndex: number): IRenderedRunNode => {
    if (!node.elements) {
        return {
            text: "",
            parts: [],
            index: -1,
            start: currentRunStringIndex,
            end: currentRunStringIndex,
        };
    }

    let currentTextStringIndex = currentRunStringIndex;

    const parts = node.elements
        .map((element, i: number) =>
            element.name === "w:t" && element.elements && element.elements.length > 0
                ? {
                      text: element.elements[0].text?.toString() ?? "",
                      index: i,
                      start: currentTextStringIndex,
                      end: (() => {
                          // Side effect
                          currentTextStringIndex += (element.elements[0].text?.toString() ?? "").length - 1;
                          return currentTextStringIndex;
                      })(),
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
        start: currentRunStringIndex,
        end: currentTextStringIndex,
    };
};

const buildNodePath = (node: ElementWrapper): readonly number[] =>
    node.parent ? [...buildNodePath(node.parent), node.index] : [node.index];
