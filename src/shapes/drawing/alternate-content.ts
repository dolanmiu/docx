/**
 * Markup compatibility: content for applications that understand a namespace, with a fallback for those that don't.
 *
 * Reference: ECMA-376 Part 3, 10.2 (AlternateContent, Choice and Fallback)
 *
 * @module
 */
import { BuilderElement, type XmlComponent } from "docx";

/**
 * Options for alternate content.
 */
export type AlternateContentOptions = {
    /** The prefix of the namespace an application needs to understand to use `choice`, such as `"wpc"` */
    readonly requires: string;
    /** The content for applications that understand the namespace */
    readonly choice: XmlComponent;
    /** The content for applications that don't */
    readonly fallback: XmlComponent;
};

/**
 * Creates an `mc:AlternateContent` element. An application uses the choice if it understands the namespace
 * that `requires` names, and the fallback otherwise.
 *
 * ## XML
 * ```xml
 * <mc:AlternateContent>
 *   <mc:Choice Requires="wpc">…</mc:Choice>
 *   <mc:Fallback>…</mc:Fallback>
 * </mc:AlternateContent>
 * ```
 */
export const createAlternateContent = ({ requires, choice, fallback }: AlternateContentOptions): XmlComponent =>
    new BuilderElement({
        name: "mc:AlternateContent",
        children: [
            new BuilderElement<{ readonly requires: string }>({
                name: "mc:Choice",
                attributes: { requires: { key: "Requires", value: requires } },
                children: [choice],
            }),
            new BuilderElement({ name: "mc:Fallback", children: [fallback] }),
        ],
    });
