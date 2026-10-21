/**
 * The styles of citation Word has, such as APA and MLA, which a document's citations and bibliographies are written in.
 *
 * @module
 */
import { apa } from "./styles/apa";
import { chicago } from "./styles/chicago";
import { gb7714 } from "./styles/gb7714";
import { gostNameSort } from "./styles/gost-name-sort";
import { gostTitleSort } from "./styles/gost-title-sort";
import { harvardAnglia } from "./styles/harvard-anglia";
import { ieee } from "./styles/ieee";
import { iso690FirstElementAndDate } from "./styles/iso-690-first-element-and-date";
import { iso690NumericalReference } from "./styles/iso-690-numerical-reference";
import { mla } from "./styles/mla";
import { sist02 } from "./styles/sist02";
import type { StyleDefinition } from "./styles/style";
import { turabian } from "./styles/turabian";

/**
 * The styles of citation Word has, as Word lists them in References > Style. Each is written as Word writes it, and its
 * citation of a book by Anna Baker from 2010 is in its description.
 *
 * @publicApi
 */
export const CitationStyle = {
    /** APA, sixth edition: "(Baker, 2010)" */
    APA: "apa",
    /** Chicago, sixteenth edition, author-date: "(Baker 2010)" */
    CHICAGO: "chicago",
    /** GB7714, China's national standard: "(Baker, 2010)" */
    GB7714: "gb7714",
    /** GOST, Russia's national standard, with the bibliography sorted by name: "(Baker, 2010)" */
    GOST_NAME_SORT: "gostNameSort",
    /** GOST, Russia's national standard, with the bibliography sorted by title: "(Baker, 2010)" */
    GOST_TITLE_SORT: "gostTitleSort",
    /** Harvard, as Anglia Ruskin University writes it: "(Baker, 2010)" */
    HARVARD_ANGLIA: "harvardAnglia",
    /** IEEE, with the sources numbered in the order they're cited: "[1]" */
    IEEE: "ieee",
    /** ISO 690, with the first element and the date: "(Baker, 2010)" */
    ISO_690_FIRST_ELEMENT_AND_DATE: "iso690FirstElementAndDate",
    /** ISO 690, with the sources numbered in the order they're cited: "(1)" */
    ISO_690_NUMERICAL_REFERENCE: "iso690NumericalReference",
    /** MLA, seventh edition: "(Baker)" */
    MLA: "mla",
    /** SIST02, Japan's standard, in full-width punctuation: "（Baker，2010）" */
    SIST02: "sist02",
    /** Turabian, sixth edition: "(Baker 2010)" */
    TURABIAN: "turabian",
} as const;

/** Each style of citation's definition */
export const STYLE_DEFINITIONS: Readonly<Record<(typeof CitationStyle)[keyof typeof CitationStyle], StyleDefinition>> = {
    apa,
    chicago,
    gb7714,
    gostNameSort,
    gostTitleSort,
    harvardAnglia,
    ieee,
    iso690FirstElementAndDate,
    iso690NumericalReference,
    mla,
    sist02,
    turabian,
};
