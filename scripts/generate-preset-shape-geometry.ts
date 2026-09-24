/**
 * Generates src/shapes/preset-shape/preset-shape-geometry.ts
 * from the preset shape definitions of Office Open XML (presetShapeDefinitions.xml, ECMA-376 Part 1).
 *
 * For each preset shape it keeps what is needed to find the shape's connection sites and where its text goes:
 * the default adjustment values (`a:avLst`), the guides the sites and text box depend on (`a:gdLst`), the sites
 * (`a:cxnLst`) and the text box (`a:rect`).
 *
 * Usage:
 *   npm run run-ts -- scripts/generate-preset-shape-geometry.ts [path/to/presetShapeDefinitions.xml]
 *
 * Without a path, the definitions are downloaded from LibreOffice, which ships a copy of the ECMA file.
 */
// cspell:ignore fmla
import { execSync } from "node:child_process";
import { readFileSync, writeFileSync } from "node:fs";

import { type Element, xml2js } from "xml-js";

import { PRESET_SHAPE_OOXML_NAMES } from "../src/shapes/preset-shape/preset-shape-type";

const SOURCE_URL = "https://raw.githubusercontent.com/LibreOffice/core/master/oox/source/drawingml/customshapes/presetShapeDefinitions.xml";
const OUTPUT = "src/shapes/preset-shape/preset-shape-geometry.ts";

const loadDefinitions = async (path?: string): Promise<string> => {
    if (path) {
        return readFileSync(path, "utf8");
    }
    const response = await fetch(SOURCE_URL);
    if (!response.ok) {
        throw new Error(`Could not download ${SOURCE_URL}: ${response.status}`);
    }
    return response.text();
};

const children = (element: Element | undefined, name?: string): readonly Element[] =>
    (element?.elements ?? []).filter((child) => child.type === "element" && (name === undefined || child.name === name));

const child = (element: Element, name: string): Element | undefined => children(element, name)[0];

const attribute = (element: Element, name: string): string => {
    const value = element.attributes?.[name];
    if (value === undefined) {
        throw new Error(`Missing ${name} on <${element.name}>`);
    }
    // A few formulas in the definitions have extra spaces
    return String(value).trim().split(/\s+/).join(" ");
};

const guides = (shape: Element, list: string): readonly (readonly [string, string])[] =>
    children(child(shape, list), "gd").map((guide) => [attribute(guide, "name"), attribute(guide, "fmla")] as const);

const main = async (): Promise<void> => {
    const document = xml2js(await loadDefinitions(process.argv[2]), { compact: false }) as Element;
    const root = children(document)[0];
    const shapes = new Map(children(root).map((shape) => [shape.name!, shape]));
    const lines: string[] = [];

    for (const [name, ooxmlName] of Object.entries(PRESET_SHAPE_OOXML_NAMES)) {
        const shape = shapes.get(ooxmlName);
        if (!shape) {
            throw new Error(`No definition for ${ooxmlName}`);
        }

        const defaults = guides(shape, "avLst").map(([guide, formula]) => {
            const [operator, value] = formula.split(" ");
            if (operator !== "val") {
                throw new Error(`Unexpected adjustment formula "${formula}" in ${ooxmlName}`);
            }
            return [guide, Number(value)] as const;
        });
        const sites = children(child(shape, "cxnLst"), "cxn").map((site) => {
            const position = child(site, "pos")!;
            return [attribute(site, "ang"), attribute(position, "x"), attribute(position, "y")] as const;
        });

        const rectangle = child(shape, "rect");
        const text = rectangle ? (["l", "t", "r", "b"] as const).map((side) => attribute(rectangle, side)) : [];

        // Keep only the guides the sites and text box depend on, in their original order. Some shapes define a guide
        // more than once, so every definition of a guide that is needed is kept
        const allGuides = guides(shape, "gdLst");
        const needed = new Set<string>();
        const pending = [...sites.flat(), ...text];
        while (pending.length > 0) {
            const token = pending.pop()!;
            const formulas = allGuides.filter(([guide]) => guide === token).map(([, formula]) => formula);
            if (formulas.length > 0 && !needed.has(token)) {
                needed.add(token);
                pending.push(...formulas.flatMap((formula) => formula.split(" ").slice(1)));
            }
        }
        const neededGuides = allGuides.filter(([guide]) => needed.has(guide));

        const parts = [
            ...(defaults.length > 0 ? [`defaults: { ${defaults.map(([guide, value]) => `${guide}: ${value}`).join(", ")} }`] : []),
            ...(neededGuides.length > 0 ? [`guides: "${neededGuides.map(([guide, formula]) => `${guide} ${formula}`).join("; ")}"`] : []),
            ...(sites.length > 0 ? [`sites: "${sites.map((site) => site.join(" ")).join("; ")}"`] : []),
            // A text box that fills the shape is left out
            ...(text.length > 0 && text.join(" ") !== "l t r b" ? [`text: "${text.join(" ")}"`] : []),
        ];
        if (parts.length > 0) {
            lines.push(`    ${name}: { ${parts.join(", ")} },`);
        }
    }

    writeFileSync(
        OUTPUT,
        `/**
 * The geometry of each preset shape that is needed to connect to it and to fit text in it: its default
 * adjustment values, its connection sites, its text box, and the guides they are calculated from.
 *
 * Generated by scripts/generate-preset-shape-geometry.ts from the preset shape definitions of
 * Office Open XML (ECMA-376 Part 1). Do not edit by hand.
 *
 * @module
 */
import type { PresetShapeType } from "./preset-shape-type";

/**
 * A preset shape's definition, as in presetShapeDefinitions.xml.
 */
export type PresetShapeGeometryDefinition = {
    /** Default values of the adjustment guides (\`a:avLst\`), keyed by guide name */
    readonly defaults?: Readonly<Record<string, number>>;
    /**
     * The guides (\`a:gdLst\`) the connection sites and text box depend on, in the order they are calculated.
     * Each is a name followed by a formula, such as \`a pin 0 adj 50000\`, and they are separated by \`; \`
     */
    readonly guides?: string;
    /**
     * Connection sites (\`a:cxnLst\`), separated by \`; \`. Each is the angle a connector leaves the shape at,
     * then x and y, such as \`3cd4 hc t\`. Each value is a guide name or a number
     */
    readonly sites?: string;
    /**
     * The box text is written in (\`a:rect\`): its left, top, right and bottom, such as \`il it ir ib\`.
     * Missing when the text box fills the shape
     */
    readonly text?: string;
};

/* cspell:disable */
export const PRESET_SHAPE_GEOMETRY: Readonly<Partial<Record<PresetShapeType, PresetShapeGeometryDefinition>>> = {
${lines.join("\n")}
};
/* cspell:enable */
`,
    );
    execSync(`npx prettier --write ${OUTPUT}`);
};

main();
