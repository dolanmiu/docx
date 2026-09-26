import { describe, expect, it } from "vitest";
import { type Element, js2xml, xml2js } from "xml-js";

import {
    attributeOf,
    childOf,
    childrenOf,
    copyOf,
    createXmlElement,
    descendantsOf,
    elementsOf,
    mapChildren,
    nameOf,
    numberOf,
    textOf,
    valueOf,
    withAttributes,
    withChild,
    withChildren,
    withoutChildren,
} from "./template-xml";

// Parsed as patchDocument parses a template's parts, with the spaces between elements
const parse = (text: string): Element => (xml2js(text, { compact: false, captureSpacesBetweenElements: true }) as Element).elements![0];

const write = (element: Element): string => js2xml({ elements: [element] });

describe("template-xml", () => {
    describe("nameOf", () => {
        it("should give an element's name, and none for text and comments", () => {
            const element = parse("<a:p>text<!-- note --></a:p>");
            expect(nameOf(element)).to.equal("a:p");
            expect(element.elements!.map(nameOf)).to.deep.equal(["", ""]);
        });
    });

    describe("elementsOf", () => {
        it("should give the child elements, without text and comments", () => {
            const element = parse("<a> <b/>text<!-- note --><c/><![CDATA[x]]></a>");
            expect(elementsOf(element).map(({ name }) => name)).to.deep.equal(["b", "c"]);
        });

        it("should give nothing for an element without children, or no element", () => {
            expect(elementsOf(parse("<a/>"))).to.deep.equal([]);
            expect(elementsOf(undefined)).to.deep.equal([]);
        });
    });

    describe("childrenOf and childOf", () => {
        const element = parse('<a><b id="1"/><c/><b id="2"/></a>');

        it("should give the children with a name, in order", () => {
            expect(childrenOf(element, "b").map((child) => attributeOf(child, "id"))).to.deep.equal(["1", "2"]);
            expect(childrenOf(element, "d")).to.deep.equal([]);
        });

        it("should give the first child with a name", () => {
            expect(attributeOf(childOf(element, "b"), "id")).to.equal("1");
            expect(childOf(element, "d")).to.equal(undefined);
            expect(childOf(undefined, "b")).to.equal(undefined);
        });

        it("should not give descendants", () => {
            expect(childOf(parse("<a><b><c/></b></a>"), "c")).to.equal(undefined);
        });
    });

    describe("descendantsOf", () => {
        it("should give every element with a name, at any depth, in document order", () => {
            const element = parse('<a><b id="1"><b id="2"><b id="3"/></b></b><c><b id="4"/></c></a>');
            expect(descendantsOf(element, "b").map((child) => attributeOf(child, "id"))).to.deep.equal(["1", "2", "3", "4"]);
        });

        it("should not give the element itself", () => {
            expect(descendantsOf(parse("<b/>"), "b")).to.deep.equal([]);
            expect(descendantsOf(undefined, "b")).to.deep.equal([]);
        });
    });

    describe("attributeOf, valueOf and numberOf", () => {
        it("should give an attribute as text", () => {
            expect(attributeOf(parse('<a x="1" y=""/>'), "x")).to.equal("1");
            expect(attributeOf(parse('<a x="1" y=""/>'), "y")).to.equal("");
            expect(attributeOf(parse("<a/>"), "x")).to.equal(undefined);
            expect(attributeOf({ attributes: { x: 5 } }, "x")).to.equal("5");
            expect(attributeOf(undefined, "x")).to.equal(undefined);
        });

        it("should give the val attribute", () => {
            expect(valueOf(parse('<c:barDir val="col"/>'))).to.equal("col");
            expect(valueOf(parse("<c:barDir/>"))).to.equal(undefined);
        });

        it("should give the val attribute as a whole number", () => {
            expect(numberOf(parse('<c:idx val="2"/>'))).to.equal(2);
            expect(numberOf(parse('<c:idx val="0"/>'))).to.equal(0);
            expect(numberOf(parse('<c:idx val=" 12 "/>'))).to.equal(12);
            expect(numberOf(parse('<c:idx val="-3"/>'))).to.equal(-3);
        });

        it("should give no number for a val that isn't a whole number, or none", () => {
            for (const value of ["", " ", "1.5", "one", "NaN", "Infinity", "1e400"]) {
                expect(numberOf(parse(`<c:idx val="${value}"/>`)), value).to.equal(undefined);
            }
            expect(numberOf(parse("<c:idx/>"))).to.equal(undefined);
            expect(numberOf(undefined)).to.equal(undefined);
        });
    });

    describe("textOf", () => {
        it("should give an element's text, and its children's", () => {
            expect(textOf(parse("<a:p><a:r><a:t>Sales</a:t></a:r><a:r><a:t> 2025</a:t></a:r></a:p>"))).to.equal("Sales 2025");
        });

        it("should give CDATA as text, and leave out comments", () => {
            expect(textOf(parse("<a>1<![CDATA[<2>]]><!-- 3 -->4</a>"))).to.equal("1<2>4");
        });

        it("should give empty text for an element without any", () => {
            expect(textOf(parse("<a/>"))).to.equal("");
            expect(textOf(undefined)).to.equal("");
            expect(textOf({ elements: [{ type: "text" }, { type: "cdata" }] })).to.equal("");
        });
    });

    describe("copyOf", () => {
        it("should copy an element, so changing the copy leaves it as it was", () => {
            const element = parse('<a x="1"><b>text</b></a>');
            const copy = copyOf(element);
            // eslint-disable-next-line functional/immutable-data
            copy.elements![0].elements![0].text = "changed";
            // eslint-disable-next-line functional/immutable-data
            copy.attributes!.x = "2";

            expect(write(element)).to.equal('<a x="1"><b>text</b></a>');
            expect(write(copy)).to.equal('<a x="2"><b>changed</b></a>');
        });
    });

    describe("withChildren and mapChildren", () => {
        it("should give a new element, leaving the element as it was", () => {
            const element = parse("<a><b/></a>");
            const changed = withChildren(element, [parse("<c/>")]);

            expect(write(changed)).to.equal("<a><c/></a>");
            expect(write(element)).to.equal("<a><b/></a>");
        });

        it("should replace each child element with none, one or several, keeping text and comments", () => {
            const element = parse("<a> <b/> <c/><!--x--><d/></a>");
            const changed = mapChildren(element, (child) => {
                switch (child.name) {
                    case "b":
                        return [];
                    case "c":
                        return [child, parse("<c2/>")];
                    default:
                        return [child];
                }
            });

            expect(write(changed)).to.equal("<a>  <c/><c2/><!--x--><d/></a>");
        });

        it("should map an element without children", () => {
            expect(write(mapChildren(parse("<a/>"), (child) => [child]))).to.equal("<a/>");
        });

        it("should remove the child elements a test picks", () => {
            expect(write(withoutChildren(parse("<a><b/><c/><b/></a>"), ({ name }) => name === "b"))).to.equal("<a><c/></a>");
        });
    });

    describe("withAttributes", () => {
        it("should add and replace attributes, keeping the others in their places", () => {
            expect(write(withAttributes(parse('<a x="1" y="2"/>'), { y: "3", z: 4 }))).to.equal('<a x="1" y="3" z="4"/>');
        });

        it("should remove an attribute given undefined", () => {
            expect(write(withAttributes(parse('<a x="1" y="2"/>'), { x: undefined, w: undefined }))).to.equal('<a y="2"/>');
        });

        it("should give attributes to an element without any", () => {
            expect(write(withAttributes(parse("<a/>"), { x: "1" }))).to.equal('<a x="1"/>');
        });

        it("should leave the element as it was", () => {
            const element = parse('<a x="1"/>');
            withAttributes(element, { x: "2" });
            expect(write(element)).to.equal('<a x="1"/>');
        });
    });

    describe("withChild", () => {
        const ORDER = ["idx", "order", "tx", "spPr", "cat", "val", "extLst"];

        it("should replace the child of the same name, in its place", () => {
            const element = parse("<ser><idx/><tx>old</tx><val/></ser>");
            expect(write(withChild(element, parse("<tx>new</tx>"), ORDER))).to.equal("<ser><idx/><tx>new</tx><val/></ser>");
        });

        it("should put a new child before the first child that comes after it", () => {
            expect(write(withChild(parse("<ser><idx/><order/><val/></ser>"), parse("<cat/>"), ORDER))).to.equal(
                "<ser><idx/><order/><cat/><val/></ser>",
            );
            expect(write(withChild(parse("<ser><val/></ser>"), parse("<idx/>"), ORDER))).to.equal("<ser><idx/><val/></ser>");
        });

        it("should put a new child last when nothing comes after it", () => {
            expect(write(withChild(parse("<ser><idx/></ser>"), parse("<val/>"), ORDER))).to.equal("<ser><idx/><val/></ser>");
            expect(write(withChild(parse("<ser/>"), parse("<val/>"), ORDER))).to.equal("<ser><val/></ser>");
        });

        it("should step over children the order doesn't name", () => {
            expect(write(withChild(parse("<ser><idx/><unknown/><val/></ser>"), parse("<tx/>"), ORDER))).to.equal(
                "<ser><idx/><unknown/><tx/><val/></ser>",
            );
            expect(write(withChild(parse("<ser><unknown/></ser>"), parse("<tx/>"), ORDER))).to.equal("<ser><unknown/><tx/></ser>");
        });

        it("should step over text and comments", () => {
            expect(write(withChild(parse("<ser> <idx/> <!--c--> <val/></ser>"), parse("<cat/>"), ORDER))).to.equal(
                "<ser> <idx/> <!--c--> <cat/><val/></ser>",
            );
        });

        it("should replace only the first of two children of the same name", () => {
            expect(write(withChild(parse("<ser><tx>1</tx><tx>2</tx></ser>"), parse("<tx>3</tx>"), ORDER))).to.equal(
                "<ser><tx>3</tx><tx>2</tx></ser>",
            );
        });

        it("should leave the element as it was", () => {
            const element = parse("<ser><idx/></ser>");
            withChild(element, parse("<val/>"), ORDER);
            expect(write(element)).to.equal("<ser><idx/></ser>");
        });
    });

    describe("createXmlElement", () => {
        it("should create an element with attributes and children", () => {
            expect(write(createXmlElement("c:externalData", { "r:id": "rId1" }, [createXmlElement("c:autoUpdate", { val: 0 })]))).to.equal(
                '<c:externalData r:id="rId1"><c:autoUpdate val="0"/></c:externalData>',
            );
        });

        it("should create an element without attributes or children", () => {
            expect(createXmlElement("c:layout")).to.deep.equal({ type: "element", name: "c:layout" });
        });
    });
});
