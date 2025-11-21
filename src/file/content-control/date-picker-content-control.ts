import { IContext, IXmlableObject, XmlComponent } from "@file/xml-components";

import { IDatePickerContentControlOptions } from "./properties";
import { contentControlIdGen } from "./shared-id-generator";
import { validateDataBinding } from "./validation-utils";

/**
 * DatePickerContentControl implementation for calendar-based date selection controls.
 *
 * Creates date picker Content Controls that provide users with a calendar interface
 * for selecting dates. These controls are inline elements ideal for any scenario
 * requiring date input with proper formatting, localization, and validation.
 *
 * The control generates OOXML structured document tags (SDT) with specialized
 * date elements that integrate seamlessly with Microsoft Word's date picker UI,
 * including support for different calendar types and international date formats.
 *
 * @example Basic date picker
 * ```typescript
 * const dueDateControl = new DatePickerContentControl({
 *     tag: "DueDate",
 *     title: "Project Due Date",
 *     dateFormat: "MM/dd/yyyy",
 *     calendarType: 'gregorian',
 *     locale: "en-US",
 *     children: [new TextRun("12/31/2024")]
 * });
 *
 * const paragraph = new Paragraph({
 *     children: [
 *         new TextRun("Project due date: "),
 *         dueDateControl,
 *         new TextRun(" (click to select)")
 *     ]
 * });
 * ```
 *
 * @example International date picker
 * ```typescript
 * const contractDateControl = new DatePickerContentControl({
 *     tag: "ContractDate",
 *     title: "Contract Execution Date",
 *     dateFormat: "dd/MM/yyyy",
 *     calendarType: 'gregorian',
 *     locale: "en-GB",
 *     defaultDate: new Date(2024, 11, 31),
 *     storeMappedDataAs: 'dateTime',
 *     appearance: 'boundingBox',
 *     color: "0066CC",
 *     dataBinding: {
 *         xpath: "/contract/executionDate",
 *         storeItemId: "{date-guid}"
 *     },
 *     children: [new TextRun("31/12/2024")]
 * });
 * ```
 */
export class DatePickerContentControl extends XmlComponent {
    private readonly tag: string;
    private readonly title?: string;
    private readonly id: number;
    private readonly dateFormat?: string;
    private readonly calendarType?: string;
    private readonly defaultDate?: Date;
    private readonly locale?: string;
    private readonly storeMappedDataAs?: string;
    private readonly appearance?: string;
    private readonly color?: string;
    private readonly dataBinding?: { readonly xpath: string; readonly storeItemId: string };
    private readonly lock?: { readonly contentLock?: boolean; readonly sdtLocked?: boolean };
    private readonly placeholder?: string;

    /**
     * Creates a new DatePickerContentControl instance.
     *
     * @param options - Configuration options for the date picker content control
     * @throws {Error} When validation fails for the provided options
     */
    public constructor(options: IDatePickerContentControlOptions) {
        super("w:sdt");

        // Validate input options
        this.validateOptions(options);

        // Validate data binding GUID format if provided
        if (options.dataBinding) {
            validateDataBinding(options.dataBinding, "DatePickerContentControl");
        }

        this.tag = options.tag;
        this.title = options.title;
        this.id = contentControlIdGen();
        this.dateFormat = options.dateFormat || "MM/dd/yyyy";
        this.calendarType = options.calendarType || "gregorian";
        this.defaultDate = options.defaultDate;
        this.locale = options.locale || "en-US";
        this.storeMappedDataAs = options.storeMappedDataAs || "text";
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
    private validateOptions(options: IDatePickerContentControlOptions): void {
        // Validate tag is not empty
        if (!options.tag || options.tag.trim().length === 0) {
            throw new Error(
                "DatePickerContentControl: 'tag' is required and cannot be empty. " +
                    "The tag serves as the unique identifier for the date picker control and is essential for programmatic access. " +
                    "Example: { tag: 'DueDate', children: [...] }",
            );
        }

        // Validate children array
        if (!options.children || options.children.length === 0) {
            throw new Error(
                "DatePickerContentControl: 'children' array is required and must contain at least one TextRun element. " +
                    "Date picker controls need content to display the current date value. " +
                    "Example: { children: [new TextRun('12/31/2024')] }",
            );
        }

        // Validate dateFormat if provided
        if (options.dateFormat && typeof options.dateFormat !== "string") {
            throw new Error(
                "DatePickerContentControl: 'dateFormat' must be a string. " +
                    "Use standard date format patterns like 'MM/dd/yyyy', 'dd/MM/yyyy', or 'yyyy-MM-dd'.",
            );
        }

        // Validate calendarType if provided
        const validCalendarTypes = ["gregorian", "hijri", "hebrew", "taiwan"];
        if (options.calendarType && !validCalendarTypes.includes(options.calendarType)) {
            throw new Error(
                `DatePickerContentControl: 'calendarType' must be one of: ${validCalendarTypes.join(", ")}. ` +
                    `Received: '${options.calendarType}'. ` +
                    "Example: { calendarType: 'gregorian' }",
            );
        }

        // Validate storeMappedDataAs if provided
        const validStorageTypes = ["text", "date", "dateTime"];
        if (options.storeMappedDataAs && !validStorageTypes.includes(options.storeMappedDataAs)) {
            throw new Error(
                `DatePickerContentControl: 'storeMappedDataAs' must be one of: ${validStorageTypes.join(", ")}. ` +
                    `Received: '${options.storeMappedDataAs}'. ` +
                    "Example: { storeMappedDataAs: 'dateTime' }",
            );
        }
    }

    /**
     * Generates the OOXML representation of this date picker content control.
     *
     * This method creates the specialized XML structure required for date picker controls,
     * including the w:date element with calendar configuration, format strings, and
     * localization settings. The generated XML follows the Office Open XML specification
     * for date picker controls.
     *
     * The generated structure includes:
     * - SDT properties with date-specific elements (w:date)
     * - Calendar configuration (format, type, locale)
     * - Default date value and storage mapping settings
     * - All standard content control properties (tag, title, appearance, etc.)
     *
     * @param context - The formatting context provided by the document processor
     * @returns The XML structure representing this date picker control, or undefined if generation fails
     *
     * @internal This method is called automatically during document generation
     */
    public prepForXml(context: IContext): IXmlableObject | undefined {
        // Generate the date element with configuration
        const dateElement = {
            "w:date": [
                // Date format string
                { "w:dateFormat": { _attr: { "w:val": this.dateFormat } } },
                // Calendar type
                { "w:calendar": { _attr: { "w:val": this.calendarType } } },
                // Locale for formatting
                { "w:lid": { _attr: { "w:val": this.locale } } },
                // Storage mapping type
                { "w:storeMappedDataAs": { _attr: { "w:val": this.storeMappedDataAs } } },
                // Full date value if default date is specified
                ...(this.defaultDate ? [{ "w:fullDate": { _attr: { "w:val": this.defaultDate.toISOString() } } }] : []),
            ],
        };

        // Generate the SDT properties section for date picker control
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
                // Add the date-specific element
                dateElement,
            ],
        };

        // Generate the SDT content section by processing children
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

        // Return the complete SDT structure for date picker control
        return {
            "w:sdt": [sdtPr, sdtContent],
        };
    }
}
