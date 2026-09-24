/**
 * Describes a diagram for screen readers, from the text of its shapes and the connectors between them. Not part of the
 * public API.
 *
 * @module
 */
import type { DocPropertiesOptions, DrawingLinkOptions, Paragraph } from "docx";

import type { IShapeConnectorOptions } from "./shape-connector";
import type { IShapeGroupChildOptions } from "./shape-drawing";
import { WORD_DEFAULT_STYLES, readTextParagraphs } from "./shape-text-styles";

type Step = {
    readonly id?: string;
    /** What the shape says: its alternative text's name, or its text */
    readonly name: string;
};

type Link = {
    readonly from: string;
    readonly to: string;
    readonly label?: string;
};

const textOf = (paragraphs: readonly Paragraph[]): string =>
    readTextParagraphs(paragraphs, WORD_DEFAULT_STYLES)
        .map(({ spans }) => spans.map(({ text }) => text).join(""))
        .join(" ")
        .replace(/\s+/g, " ")
        .trim();

const endId = (end: IShapeConnectorOptions["from"]): string => (typeof end === "string" ? end : end.id);

/**
 * The shapes and pictures in a diagram that say something, and those in the groups inside it, in the order they are given.
 */
const stepsOf = (children: readonly IShapeGroupChildOptions[]): readonly Step[] =>
    children.flatMap((child): readonly Step[] => {
        switch (child.type) {
            case "connector":
                return [];
            case "group":
                return stepsOf(child.children);
            case "picture":
                return [{ id: child.id, name: child.altText?.name ?? "" }];
            default: {
                const text = [child.text ?? "", textOf(child.children ?? [])].join(" ").replace(/\s+/g, " ").trim();
                return [{ id: child.id, name: child.altText?.name ?? text }];
            }
        }
    });

const linksOf = (children: readonly IShapeGroupChildOptions[]): readonly Link[] =>
    children.flatMap((child): readonly Link[] => {
        if (child.type === "group") {
            return linksOf(child.children);
        }
        if (child.type !== "connector") {
            return [];
        }
        const label =
            typeof child.label === "string"
                ? child.label
                : typeof child.label?.text === "string"
                  ? child.label.text
                  : textOf(child.label?.text ?? []);
        return [{ from: endId(child.from), to: endId(child.to), label: label.trim() || undefined }];
    });

const endsSentence = (text: string): boolean => /[.?!]$/.test(text);

/**
 * Describes a diagram: each flow of connected shapes from its start, such as "Start, then Write the draft, then
 * Approved? Yes: Publish. No: Fix it, then back to Write the draft.", then the shapes that aren't connected.
 * Shapes and pictures without text or alternative text are left out.
 *
 * @returns The description, or an empty string if nothing in the diagram says anything
 */
export const describeDiagram = (children: readonly IShapeGroupChildOptions[]): string => {
    const steps = stepsOf(children);
    const named = steps.filter(({ name }) => name.length > 0);
    const links = linksOf(children).filter(({ from, to }) => from !== to);
    const stepWith = (id: string): Step | undefined => steps.find((step) => step.id === id);
    const nameOf = (id: string): string => stepWith(id)?.name ?? "";

    /** A sentence being told, the shapes told so far, and sentences about the shapes it leads to, told after it */
    type Told = { readonly text: string; readonly seen: ReadonlySet<string>; readonly after: readonly string[] };

    const sentence = (text: string): string => (endsSentence(text) ? text : `${text}.`);

    // Tells the flow from a shape along its connectors. Shapes already told are named, not told again, and a
    // connector back to a shape on the way to this one goes "back to" it
    const tell = (id: string, path: readonly string[], seen: ReadonlySet<string>): Told => {
        const name = nameOf(id);
        if (seen.has(id)) {
            return { text: path.includes(id) ? `back to ${name}` : name, seen, after: [] };
        }
        const told = new Set([...seen, id]);
        const next = links.filter(({ from, to }) => from === id && nameOf(to).length > 0);
        if (next.length === 0) {
            return { text: name, seen: told, after: [] };
        }
        if (next.length === 1) {
            const rest = tell(next[0].to, [...path, id], told);
            return { ...rest, text: `${name}, then ${rest.text}` };
        }
        // A shape with several ways on without labels, such as a box in an org chart: the shapes it leads to, then
        // a sentence for each of them that leads on
        if (next.every(({ label }) => label === undefined)) {
            const names = next.map(({ to }) => nameOf(to));
            const list = names.length === 2 ? names.join(" and ") : `${names.slice(0, -1).join(", ")} and ${names[names.length - 1]}`;
            return next.reduce<Told>(
                (done, { to }) => {
                    const branch = tell(to, [...path, id], done.seen);
                    const onward = branch.text === nameOf(to) ? [] : [sentence(branch.text)];
                    return { ...done, seen: branch.seen, after: [...done.after, ...onward, ...branch.after] };
                },
                { text: `${name} leads to ${list}`, seen: told, after: [] },
            );
        }
        // A shape with several ways on, such as a decision: each way, with its connector's label
        return next.reduce<Told>(
            (done, { to, label }) => {
                const branch = tell(to, [...path, id], done.seen);
                return {
                    text: `${done.text} ${sentence(`${label ? `${label}: ` : "Then "}${branch.text}`)}`,
                    seen: branch.seen,
                    after: [...done.after, ...branch.after],
                };
            },
            { text: sentence(name), seen: told, after: [] },
        );
    };

    // Flows start at the shapes no connector leads to, then any shapes left, such as those in a loop
    const starts = [
        ...named.filter(({ id }) => id === undefined || !links.some(({ to }) => to === id)),
        ...named.filter(({ id }) => id !== undefined && links.some(({ to }) => to === id)),
    ];
    return starts
        .reduce<{ readonly seen: ReadonlySet<string>; readonly sentences: readonly string[] }>(
            (done, step) => {
                if (step.id !== undefined && done.seen.has(step.id)) {
                    return done;
                }
                const told = step.id === undefined ? { text: step.name, seen: done.seen, after: [] } : tell(step.id, [], done.seen);
                return { seen: told.seen, sentences: [...done.sentences, sentence(told.text), ...told.after] };
            },
            { seen: new Set(), sentences: [] },
        )
        .sentences.join(" ");
};

/**
 * The alternative text of a group or canvas: its own, with a description of the diagram when it has none and isn't
 * decorative.
 */
export const describeDrawing = ({
    altText,
    decorative,
    children,
}: DrawingLinkOptions & {
    readonly altText?: DocPropertiesOptions;
    readonly children: readonly IShapeGroupChildOptions[];
}): DocPropertiesOptions | undefined => {
    if (decorative || altText?.description) {
        return altText;
    }
    const description = describeDiagram(children);
    if (description.length === 0) {
        return altText;
    }
    return altText ? { ...altText, description } : { name: "", description, title: "" };
};
