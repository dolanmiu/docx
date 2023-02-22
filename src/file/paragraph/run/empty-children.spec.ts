import { expect } from "chai";

import { Formatter } from "@export/formatter";
import {
    AnnotationReference,
    CarriageReturn,
    ContinuationSeparator,
    DayLong,
    DayShort,
    EndnoteReference,
    FootnoteReferenceElement,
    LastRenderedPageBreak,
    MonthLong,
    MonthShort,
    NoBreakHyphen,
    PageNumberElement,
    Separator,
    SoftHyphen,
    Tab,
    YearLong,
    YearShort,
} from "./empty-children";

//         <xsd:element name="noBreakHyphen" type="CT_Empty"/>
//         <xsd:element name="softHyphen" type="CT_Empty" minOccurs="0" />
//         <xsd:element name="dayShort" type="CT_Empty" minOccurs="0" />
//         <xsd:element name="monthShort" type="CT_Empty" minOccurs="0" />
//         <xsd:element name="yearShort" type="CT_Empty" minOccurs="0" />
//         <xsd:element name="dayLong" type="CT_Empty" minOccurs="0" />
//         <xsd:element name="monthLong" type="CT_Empty" minOccurs="0" />
//         <xsd:element name="yearLong" type="CT_Empty" minOccurs="0" />
//         <xsd:element name="annotationRef" type="CT_Empty" minOccurs="0" />
//         <xsd:element name="footnoteRef" type="CT_Empty" minOccurs="0" />
//         <xsd:element name="endnoteRef" type="CT_Empty" minOccurs="0" />
//         <xsd:element name="separator" type="CT_Empty" minOccurs="0" />
//         <xsd:element name="continuationSeparator" type="CT_Empty" minOccurs="0" />
//         ...
//         <xsd:element name="pgNum" type="CT_Empty" minOccurs="0" />
//         <xsd:element name="cr" type="CT_Empty" minOccurs="0" />
//         <xsd:element name="tab" type="CT_Empty" minOccurs="0" />
//         ...
//         <xsd:element name="lastRenderedPageBreak" type="CT_Empty" minOccurs="0" maxOccurs="1" />

describe("NoBreakHyphen", () => {
    describe("#constructor()", () => {
        it("should create a NoBreakHyphen with correct root key", () => {
            const tree = new Formatter().format(new NoBreakHyphen());
            expect(tree).to.deep.equal({
                "w:noBreakHyphen": {},
            });
        });
    });
});

describe("SoftHyphen", () => {
    describe("#constructor()", () => {
        it("should create a SoftHyphen with correct root key", () => {
            const tree = new Formatter().format(new SoftHyphen());
            expect(tree).to.deep.equal({
                "w:softHyphen": {},
            });
        });
    });
});

describe("DayShort", () => {
    describe("#constructor()", () => {
        it("should create a DayShort with correct root key", () => {
            const tree = new Formatter().format(new DayShort());
            expect(tree).to.deep.equal({
                "w:dayShort": {},
            });
        });
    });
});

describe("MonthShort", () => {
    describe("#constructor()", () => {
        it("should create a MonthShort with correct root key", () => {
            const tree = new Formatter().format(new MonthShort());
            expect(tree).to.deep.equal({
                "w:monthShort": {},
            });
        });
    });
});

describe("YearShort", () => {
    describe("#constructor()", () => {
        it("should create a YearShort with correct root key", () => {
            const tree = new Formatter().format(new YearShort());
            expect(tree).to.deep.equal({
                "w:yearShort": {},
            });
        });
    });
});

describe("DayLong", () => {
    describe("#constructor()", () => {
        it("should create a DayLong with correct root key", () => {
            const tree = new Formatter().format(new DayLong());
            expect(tree).to.deep.equal({
                "w:dayLong": {},
            });
        });
    });
});

describe("MonthLong", () => {
    describe("#constructor()", () => {
        it("should create a MonthLong with correct root key", () => {
            const tree = new Formatter().format(new MonthLong());
            expect(tree).to.deep.equal({
                "w:monthLong": {},
            });
        });
    });
});

describe("YearLong", () => {
    describe("#constructor()", () => {
        it("should create a YearLong with correct root key", () => {
            const tree = new Formatter().format(new YearLong());
            expect(tree).to.deep.equal({
                "w:yearLong": {},
            });
        });
    });
});

describe("AnnotationReference", () => {
    describe("#constructor()", () => {
        it("should create a AnnotationReference with correct root key", () => {
            const tree = new Formatter().format(new AnnotationReference());
            expect(tree).to.deep.equal({
                "w:annotationRef": {},
            });
        });
    });
});

describe("FootnoteReferenceElement", () => {
    describe("#constructor()", () => {
        it("should create a FootnoteReferenceElement with correct root key", () => {
            const tree = new Formatter().format(new FootnoteReferenceElement());
            expect(tree).to.deep.equal({
                "w:footnoteRef": {},
            });
        });
    });
});

describe("EndnoteReference", () => {
    describe("#constructor()", () => {
        it("should create a EndnoteReference with correct root key", () => {
            const tree = new Formatter().format(new EndnoteReference());
            expect(tree).to.deep.equal({
                "w:endnoteRef": {},
            });
        });
    });
});

describe("Separator", () => {
    describe("#constructor()", () => {
        it("should create a Separator with correct root key", () => {
            const tree = new Formatter().format(new Separator());
            expect(tree).to.deep.equal({
                "w:separator": {},
            });
        });
    });
});

describe("ContinuationSeparator", () => {
    describe("#constructor()", () => {
        it("should create a ContinuationSeparator with correct root key", () => {
            const tree = new Formatter().format(new ContinuationSeparator());
            expect(tree).to.deep.equal({
                "w:continuationSeparator": {},
            });
        });
    });
});

describe("PageNumberElement", () => {
    describe("#constructor()", () => {
        it("should create a PageNumberElement with correct root key", () => {
            const tree = new Formatter().format(new PageNumberElement());
            expect(tree).to.deep.equal({
                "w:pgNum": {},
            });
        });
    });
});

describe("CarriageReturn", () => {
    describe("#constructor()", () => {
        it("should create a CarriageReturn with correct root key", () => {
            const tree = new Formatter().format(new CarriageReturn());
            expect(tree).to.deep.equal({
                "w:cr": {},
            });
        });
    });
});

describe("Tab", () => {
    describe("#constructor()", () => {
        it("should create a Tab with correct root key", () => {
            const tree = new Formatter().format(new Tab());
            expect(tree).to.deep.equal({
                "w:tab": {},
            });
        });
    });
});

describe("LastRenderedPageBreak", () => {
    describe("#constructor()", () => {
        it("should create a LastRenderedPageBreak with correct root key", () => {
            const tree = new Formatter().format(new LastRenderedPageBreak());
            expect(tree).to.deep.equal({
                "w:lastRenderedPageBreak": {},
            });
        });
    });
});
