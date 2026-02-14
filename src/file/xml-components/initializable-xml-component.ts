/**
 * Initializable XML Component module.
 *
 * This module provides a base class for XML components that can be initialized
 * from another component's state, useful for component reuse and composition.
 *
 * @module
 */
import { XmlComponent } from "@file/xml-components";

/**
 * XML component that can be initialized from another component.
 *
 * InitializableXmlComponent extends XmlComponent to support copying the internal
 * state (root array) from another component. This is useful when you need to
 * create a new component that shares or extends the children of an existing component.
 *
 * @example
 * ```typescript
 * class MyElement extends InitializableXmlComponent {
 *   constructor(init?: MyElement) {
 *     super("w:myElement", init);
 *     // If init is provided, this.root is copied from init
 *     // Otherwise, this.root is an empty array
 *   }
 * }
 *
 * const element1 = new MyElement();
 * element1.addChildElement(new TextRun("Hello"));
 *
 * const element2 = new MyElement(element1);
 * // element2 now has the same children as element1
 * ```
 */
export abstract class InitializableXmlComponent extends XmlComponent {
    /**
     * Creates a new InitializableXmlComponent.
     *
     * @param rootKey - The XML element name
     * @param initComponent - Optional component to copy children from
     */
    public constructor(rootKey: string, initComponent?: InitializableXmlComponent) {
        super(rootKey);

        if (initComponent) {
            this.root = initComponent.root;
        }
    }
}
