import { FileChild } from "@file/file-child";
import { IContext, IXmlableObject } from "@file/xml-components";

import { IBlockContentControlOptions } from "./properties";
import { contentControlIdGen } from "./shared-id-generator";
import { validateDataBinding } from "./validation-utils";

/**
 * BlockContentControl implementation for block-level (document-level) content controls.
 *
 * Creates a Rich Text Content Control that can be placed at the document level
 * alongside other block elements like paragraphs and tables. These controls are ideal
 * for entire sections of content such as address blocks, terms and conditions,
 * or any multi-paragraph structured content.
 *
 * The control generates OOXML structured document tags (SDT) with rich text properties,
 * allowing it to contain multiple paragraphs, tables, and complex formatting that
 * integrates seamlessly with Microsoft Word's Content Control functionality.
 *
 * @example Basic block control
 * ```typescript
 * const addressBlock = new BlockContentControl({
 *     tag: "CustomerAddress",
 *     title: "Customer Address",
 *     children: [
 *         new Paragraph("Customer Name"),
 *         new Paragraph("123 Main Street"),
 *         new Paragraph("City, State 12345")
 *     ]
 * });
 *
 * const doc = new Document({
 *     sections: [{
 *         children: [
 *             new Paragraph("Invoice"),
 *             addressBlock,
 *             new Paragraph("Invoice details...")
 *         ]
 *     }]
 * });
 * ```
 *
 * @example Complex content with tables
 * ```typescript
 * const orderSummary = new BlockContentControl({
 *     tag: "OrderSummary",
 *     title: "Order Summary Section",
 *     children: [
 *         new Paragraph({
 *             children: [new TextRun({ text: "Order Details", bold: true })]
 *         }),
 *         new Table({
 *             rows: [
 *                 new TableRow({
 *                     children: [
 *                         new TableCell({ children: [new Paragraph("Item")] }),
 *                         new TableCell({ children: [new Paragraph("Price")] })
 *                     ]
 *                 })
 *             ]
 *         }),
 *         new Paragraph("Total: $XXX.XX")
 *     ]
 * });
 * ```
 */
export class BlockContentControl extends FileChild {
    private readonly tag: string;
    private readonly title?: string;
    private readonly id: number;
    private readonly appearance?: string;
    private readonly color?: string;
    private readonly dataBinding?: { readonly xpath: string; readonly storeItemId: string };
    private readonly lock?: { readonly contentLock?: boolean; readonly sdtLocked?: boolean };
    private readonly placeholder?: string;

    /**
     * Creates a new BlockContentControl instance.
     *
     * @param options - Configuration options for the block content control
     * @throws {Error} When validation fails for the provided options
     */
    public constructor(options: IBlockContentControlOptions) {
        super("w:sdt");

        // Validate input options
        this.validateOptions(options);

        // Validate data binding GUID format if provided
        if (options.dataBinding) {
            validateDataBinding(options.dataBinding, "BlockContentControl");
        }

        this.tag = options.tag;
        this.title = options.title;
        this.id = contentControlIdGen();
        this.appearance = options.appearance;
        this.color = options.color;
        this.dataBinding = options.dataBinding;
        this.lock = options.lock;
        this.placeholder = options.placeholder;

        // Add children to the root array
        for (const child of options.children) {
            this.root.push(child);
        }
    }

    /**
     * Validates the constructor options and throws descriptive errors for invalid configurations.
     *
     * @private
     * @param options - The options to validate
     * @throws {Error} When validation fails
     */
    private validateOptions(options: IBlockContentControlOptions): void {
        // Validate tag is not empty
        if (!options.tag || options.tag.trim().length === 0) {
            throw new Error(
                "BlockContentControl: 'tag' is required and cannot be empty. " +
                    "The tag serves as the unique identifier for the content control and is essential for programmatic access. " +
                    "Example: { tag: 'CustomerAddress', children: [...] }",
            );
        }

        // Validate children array exists and is not empty
        if (!options.children || options.children.length === 0) {
            throw new Error(
                "BlockContentControl: 'children' array is required and must contain at least one Paragraph or Table element. " +
                    "Block content controls must have visible content to function properly in Microsoft Word. " +
                    "Example: { tag: 'MySection', children: [new Paragraph('Section content')] }",
            );
        }

        // Validate all children are Paragraph, Table, or BlockContentControl instances
        const invalidChildren = options.children.filter((child) => {
            if (!child || typeof child !== "object" || !("prepForXml" in child)) {
                return true;
            }
            // Check if it's a FileChild (has the fileChild symbol) like Paragraph, Table, or BlockContentControl
            return !("fileChild" in child);
        });

        if (invalidChildren.length > 0) {
            throw new Error(
                "BlockContentControl: All children must be Paragraph, Table, or BlockContentControl instances. " +
                    `Found ${invalidChildren.length} invalid child element(s). ` +
                    "BlockContentControl is a block-level element and can only contain other block-level elements. " +
                    "For inline content within paragraphs, use RunContentControl instead. " +
                    "Nesting BlockContentControls is supported for complex document structures.",
            );
        }
    }

    /**
     * Generates the OOXML representation of this block content control.
     *
     * This method is called by the document formatter to convert the high-level
     * BlockContentControl object into the low-level XML structure required for
     * .docx files. The generated XML follows the Office Open XML specification
     * for block-level structured document tags (SDT).
     *
     * The generated structure includes:
     * - SDT properties (w:sdtPr) with tag, ID, title, and rich text marker
     * - SDT content (w:sdtContent) containing the processed child Paragraph/Table elements
     *
     * Key difference from RunContentControl: Uses <w:richText/> instead of <w:text/>
     * to indicate this control can contain formatted paragraphs and tables.
     *
     * @param context - The formatting context provided by the document processor
     * @returns The XML structure representing this block content control, or undefined if generation fails
     *
     * @internal This method is called automatically during document generation
     */
    public prepForXml(context: IContext): IXmlableObject | undefined {
        // Generate the SDT properties section for a rich text (block-level) control
        // This defines the content control's metadata and behavior in Microsoft Word
        const sdtPr = {
            "w:sdtPr": [
                // Add user-friendly title (appears in Word's Developer tools)
                ...(this.title ? [{ "w:alias": { _attr: { "w:val": this.title } } }] : []),
                // Add machine-readable tag (required - used for programmatic access)
                { "w:tag": { _attr: { "w:val": this.tag } } },
                // Add unique numeric ID (required - used by Word internally)
                { "w:id": { _attr: { "w:val": this.id.toString() } } },
                // Add appearance mode if specified
                ...(this.appearance ? [{ "w:appearance": { _attr: { "w:val": this.appearance } } }] : []),
                // Add border color if specified
                ...(this.color ? [{ "w:color": { _attr: { "w:val": this.color } } }] : []),
                // Add data binding if specified
                ...(this.dataBinding
                    ? [
                          {
                              "w:dataBinding": {
                                  _attr: {
                                      "w:xpath": this.dataBinding.xpath,
                                      "w:storeItemID": this.dataBinding.storeItemId,
                                  },
                              },
                          },
                      ]
                    : []),
                // Add locking properties if specified
                ...(this.lock
                    ? [
                          {
                              "w:lock": {
                                  _attr: {
                                      ...(this.lock.contentLock ? { "w:contentLocked": "1" } : {}),
                                      ...(this.lock.sdtLocked ? { "w:sdtLocked": "1" } : {}),
                                  },
                              },
                          },
                      ]
                    : []),
                // Add placeholder indicator if specified
                ...(this.placeholder ? [{ "w:showingPlcHdr": {} }] : []),
                // Mark as rich text control (allows multiple paragraphs, tables, and formatting)
                { "w:richText": {} },
            ],
        };

        // Generate the SDT content section by processing child Paragraph/Table elements
        // Each child's prepForXml method is called to generate its XML representation
        const processedChildren = this.root
            .map((child) => {
                if (typeof child === "object" && "prepForXml" in child) {
                    return child.prepForXml(context);
                }
                return child;
            })
            .filter((child) => child !== undefined);

        const sdtContent = {
            "w:sdtContent": processedChildren,
        };

        // Return the complete SDT structure as required by the OOXML specification
        // The structure is: <w:sdt><w:sdtPr>...</w:sdtPr><w:sdtContent>...</w:sdtContent></w:sdt>
        return {
            "w:sdt": [sdtPr, sdtContent],
        };
    }
}
