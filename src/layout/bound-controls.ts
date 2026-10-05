/**
 * Content controls bound to custom XML (`w:dataBinding`), which Word fills in from the XML when it opens a document.
 *
 * @module
 */
import { type XmlObject, attributesOf, childrenOf, isObject } from "../text-layout";

/**
 * The stores of data content controls are bound to, by their ids (`w:storeItemID`) in capitals: the custom XML parts of a
 * package, by their own (`ds:itemID`), and its core and extended properties, by the ids Word gives them, each the root
 * element of its part
 */
export type DataStores = ReadonlyMap<string, XmlObject>;

/** The name of an element, such as `w:sdt` */
const nameOf = (element: XmlObject): string => Object.keys(element)[0];

/** The namespace of a prefix in an element, from its declarations and those of the elements it is in (`scope`) */
const withDeclarations = (element: XmlObject, scope: ReadonlyMap<string, string>): ReadonlyMap<string, string> => {
    const declared = Object.entries(attributesOf(element[nameOf(element)])).flatMap(([name, value]) => {
        const prefix = /^xmlns(?::(.+))?$/.exec(name);
        return prefix ? [[prefix[1] ?? "", String(value)] as const] : [];
    });
    return declared.length === 0 ? scope : new Map([...scope, ...declared]);
};

/** The text an element has in it, in order */
const textOf = (content: unknown): string =>
    (content as readonly unknown[])
        .map((part) => (typeof part === "string" ? part : isObject(part) && !("_attr" in part) ? textOf(part[nameOf(part)]) : ""))
        .join("");

// A step of the paths Word writes in its bindings, such as `ns0:title[1]`: an element's name, with its prefix, and which
// of the elements of that name it is, from 1
const STEP = /^(?:([\w.-]+):)?([\w.-]+)(?:\[(\d+)\])?$/;

/**
 * The text of the element a binding's path (`w:xpath`) leads to in its store, as Word fills the control in with it, or
 * undefined where that isn't known: a store the package hasn't, or a path other than one of elements from the root, such
 * as `/ns1:coreProperties[1]/ns0:title[1]`, which Word writes, with the namespaces its prefixes are given
 * (`w:prefixMappings`)
 */
export const boundText = (binding: XmlObject, stores: DataStores): string | undefined => {
    const { "w:xpath": path, "w:prefixMappings": mappings, "w:storeItemID": id } = binding;
    const store = id === undefined ? undefined : stores.get(String(id).toUpperCase());
    const written = String(path ?? "");
    const steps = written
        .split("/")
        .slice(1)
        .map((step) => STEP.exec(step.trim()));
    if (store === undefined || !written.startsWith("/") || steps.some((step) => step === null)) {
        return undefined;
    }
    const prefixes = new Map(
        [...String(mappings ?? "").matchAll(/xmlns:([\w.-]+)\s*=\s*(['"])(.*?)\2/g)].map((mapping) => [mapping[1], mapping[3]]),
    );
    let candidates: readonly (readonly [XmlObject, ReadonlyMap<string, string>])[] = [[store, withDeclarations(store, new Map())]];
    let found: readonly [XmlObject, ReadonlyMap<string, string>] | undefined;
    for (const step of steps) {
        const [, prefix, local, index = "1"] = step!;
        const namespace = prefix === undefined ? "" : prefixes.get(prefix);
        if (namespace === undefined) {
            return undefined;
        }
        const matching = candidates.filter(([candidate, declared]) => {
            const [own, ownLocal] = nameOf(candidate).includes(":") ? nameOf(candidate).split(":") : ["", nameOf(candidate)];
            return ownLocal === local && (declared.get(own) ?? "") === namespace;
        });
        found = matching[Number(index) - 1];
        if (found === undefined) {
            return undefined;
        }
        const [element, scope] = found;
        candidates = childrenOf(element[nameOf(element)])
            .filter((child) => !("_attr" in child))
            .map((child) => [child, withDeclarations(child, scope)] as const);
    }
    return textOf(found![0][nameOf(found![0])]);
};

// What a control's content may have in it besides its text for the text to be all it shows
const TEXT_ONLY = new Set([
    "w:r",
    "w:rPr",
    "w:t",
    "w:proofErr",
    "w:bookmarkStart",
    "w:bookmarkEnd",
    "w:p",
    "w:pPr",
    "w:lastRenderedPageBreak",
]);

/** The text written in a control's content, when that is all it shows, as Word fills it in with text */
const writtenText = (content: unknown): string | undefined => {
    const parts = childrenOf(content).filter((part) => !("_attr" in part));
    if (parts.some((part) => !TEXT_ONLY.has(nameOf(part)))) {
        return undefined;
    }
    const texts = parts.map((part) => (nameOf(part) === "w:t" ? textOf(part["w:t"]) : writtenText(part[nameOf(part)])));
    return texts.some((text) => text === undefined) ? undefined : texts.join("");
};

/**
 * Some XML of a document with the bindings to custom XML taken out of the content controls whose text is already what Word
 * fills them in with when it opens the document, as it then shows what is written: their binding's text, where the stores
 * have it, and the control only text. Those whose text Word fills in otherwise keep theirs, so the layout stops at them
 */
export const withBoundTextWritten = <T>(xml: T, stores: DataStores): T => {
    if (stores.size === 0) {
        return xml;
    }
    const visit = (value: unknown): unknown => {
        if (Array.isArray(value)) {
            return value.map(visit);
        }
        if (!isObject(value) || "_attr" in value) {
            return value;
        }
        const name = nameOf(value);
        const content = visit(value[name]);
        if (name !== "w:sdt") {
            return { [name]: content };
        }
        const parts = childrenOf(content);
        const properties = parts.find((part) => "w:sdtPr" in part);
        const binding = childrenOf(properties?.["w:sdtPr"]).find((part) => "w:dataBinding" in part);
        const written = writtenText(parts.find((part) => "w:sdtContent" in part)?.["w:sdtContent"]);
        if (binding === undefined || written === undefined || boundText(attributesOf(binding["w:dataBinding"]), stores) !== written) {
            return { [name]: content };
        }
        const unbound = { "w:sdtPr": childrenOf(properties!["w:sdtPr"]).filter((part) => part !== binding) };
        return { [name]: (content as readonly unknown[]).map((part) => (part === properties ? unbound : part)) };
    };
    return visit(xml) as T;
};
