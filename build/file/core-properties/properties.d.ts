import { XmlComponent } from "../../file/xml-components";
import { ICustomPropertyOptions } from "../custom-properties";
import { IDocumentBackgroundOptions } from "../document";
import { ISectionOptions } from "../file";
import { INumberingOptions } from "../numbering";
import { Paragraph } from "../paragraph";
import { IStylesOptions } from "../styles";
export interface IPropertiesOptions {
    readonly sections: ISectionOptions[];
    readonly title?: string;
    readonly subject?: string;
    readonly creator?: string;
    readonly keywords?: string;
    readonly description?: string;
    readonly lastModifiedBy?: string;
    readonly revision?: number;
    readonly externalStyles?: string;
    readonly styles?: IStylesOptions;
    readonly numbering?: INumberingOptions;
    readonly footnotes?: {
        readonly [key: string]: {
            readonly children: Paragraph[];
        };
    };
    readonly background?: IDocumentBackgroundOptions;
    readonly features?: {
        readonly trackRevisions?: boolean;
        readonly updateFields?: boolean;
    };
    readonly compatabilityModeVersion?: number;
    readonly customProperties?: ICustomPropertyOptions[];
    readonly evenAndOddHeaderAndFooters?: boolean;
}
export declare class CoreProperties extends XmlComponent {
    constructor(options: Omit<IPropertiesOptions, "sections">);
}
