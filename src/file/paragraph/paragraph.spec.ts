import { assert, expect } from "chai";
import { SinonStub, stub } from "sinon";

import * as convenienceFunctions from "@util/convenience-functions";

import { HorizontalPositionAlign, VerticalPositionAlign } from "@file/shared";
import { Formatter } from "@export/formatter";
import { BorderStyle } from "@file/border";
import { EMPTY_OBJECT } from "@file/xml-components";

import { IViewWrapper } from "../document-wrapper";
import { File } from "../file";
import { ShadingType } from "../shading";
import { AlignmentType, HeadingLevel, LeaderType, PageBreak, TabStopPosition, TabStopType } from "./formatting";
import { FrameAnchorType } from "./frame";
import { Bookmark, ExternalHyperlink } from "./links";
import { Paragraph } from "./paragraph";
import { TextRun } from "./run";

describe("Paragraph", () => {
    before(() => {
        stub(convenienceFunctions, "uniqueId").callsFake(() => "test-unique-id");
        stub(convenienceFunctions, "uniqueNumericId").callsFake(() => -101);
    });

    after(() => {
        (convenienceFunctions.uniqueId as SinonStub).restore();
        (convenienceFunctions.uniqueNumericId as SinonStub).restore();
    });

    describe("#constructor()", () => {
        it("should create valid JSON", () => {
            const paragraph = new Paragraph("");
            const stringifiedJson = JSON.stringify(paragraph);

            try {
                JSON.parse(stringifiedJson);
            } catch (e) {
                assert.isTrue(false);
            }
            assert.isTrue(true);
        });

        it("should create have valid properties", () => {
            const paragraph = new Paragraph("");
            const stringifiedJson = JSON.stringify(paragraph);
            const newJson = JSON.parse(stringifiedJson);
            assert.equal(newJson.root[0].rootKey, "w:pPr");
        });
    });

    describe("#heading1()", () => {
        it("should add heading style to JSON", () => {
            const paragraph = new Paragraph({
                heading: HeadingLevel.HEADING_1,
            });
            const tree = new Formatter().format(paragraph);
            expect(tree).to.deep.equal({
                "w:p": [
                    {
                        "w:pPr": [{ "w:pStyle": { _attr: { "w:val": "Heading1" } } }],
                    },
                ],
            });
        });
    });

    describe("#heading2()", () => {
        it("should add heading style to JSON", () => {
            const paragraph = new Paragraph({
                heading: HeadingLevel.HEADING_2,
            });
            const tree = new Formatter().format(paragraph);
            expect(tree).to.deep.equal({
                "w:p": [
                    {
                        "w:pPr": [{ "w:pStyle": { _attr: { "w:val": "Heading2" } } }],
                    },
                ],
            });
        });
    });

    describe("#heading3()", () => {
        it("should add heading style to JSON", () => {
            const paragraph = new Paragraph({
                heading: HeadingLevel.HEADING_3,
            });
            const tree = new Formatter().format(paragraph);
            expect(tree).to.deep.equal({
                "w:p": [
                    {
                        "w:pPr": [{ "w:pStyle": { _attr: { "w:val": "Heading3" } } }],
                    },
                ],
            });
        });
    });

    describe("#heading4()", () => {
        it("should add heading style to JSON", () => {
            const paragraph = new Paragraph({
                heading: HeadingLevel.HEADING_4,
            });
            const tree = new Formatter().format(paragraph);
            expect(tree).to.deep.equal({
                "w:p": [
                    {
                        "w:pPr": [{ "w:pStyle": { _attr: { "w:val": "Heading4" } } }],
                    },
                ],
            });
        });
    });

    describe("#heading5()", () => {
        it("should add heading style to JSON", () => {
            const paragraph = new Paragraph({
                heading: HeadingLevel.HEADING_5,
            });
            const tree = new Formatter().format(paragraph);
            expect(tree).to.deep.equal({
                "w:p": [
                    {
                        "w:pPr": [{ "w:pStyle": { _attr: { "w:val": "Heading5" } } }],
                    },
                ],
            });
        });
    });

    describe("#heading6()", () => {
        it("should add heading style to JSON", () => {
            const paragraph = new Paragraph({
                heading: HeadingLevel.HEADING_6,
            });
            const tree = new Formatter().format(paragraph);
            expect(tree).to.deep.equal({
                "w:p": [
                    {
                        "w:pPr": [{ "w:pStyle": { _attr: { "w:val": "Heading6" } } }],
                    },
                ],
            });
        });
    });

    describe("#title()", () => {
        it("should add title style to JSON", () => {
            const paragraph = new Paragraph({
                heading: HeadingLevel.TITLE,
            });
            const tree = new Formatter().format(paragraph);
            expect(tree).to.deep.equal({
                "w:p": [
                    {
                        "w:pPr": [{ "w:pStyle": { _attr: { "w:val": "Title" } } }],
                    },
                ],
            });
        });
    });

    describe("#center()", () => {
        it("should add center alignment to JSON", () => {
            const paragraph = new Paragraph({
                alignment: AlignmentType.CENTER,
            });
            const tree = new Formatter().format(paragraph);
            expect(tree).to.deep.equal({
                "w:p": [
                    {
                        "w:pPr": [{ "w:jc": { _attr: { "w:val": "center" } } }],
                    },
                ],
            });
        });
    });

    describe("#left()", () => {
        it("should add left alignment to JSON", () => {
            const paragraph = new Paragraph({
                alignment: AlignmentType.LEFT,
            });
            const tree = new Formatter().format(paragraph);
            expect(tree).to.deep.equal({
                "w:p": [
                    {
                        "w:pPr": [{ "w:jc": { _attr: { "w:val": "left" } } }],
                    },
                ],
            });
        });
    });

    describe("#right()", () => {
        it("should add right alignment to JSON", () => {
            const paragraph = new Paragraph({
                alignment: AlignmentType.RIGHT,
            });
            const tree = new Formatter().format(paragraph);
            expect(tree).to.deep.equal({
                "w:p": [
                    {
                        "w:pPr": [{ "w:jc": { _attr: { "w:val": "right" } } }],
                    },
                ],
            });
        });
    });

    describe("#start()", () => {
        it("should add start alignment to JSON", () => {
            const paragraph = new Paragraph({
                alignment: AlignmentType.START,
            });
            const tree = new Formatter().format(paragraph);
            expect(tree).to.deep.equal({
                "w:p": [
                    {
                        "w:pPr": [{ "w:jc": { _attr: { "w:val": "start" } } }],
                    },
                ],
            });
        });
    });

    describe("#end()", () => {
        it("should add end alignment to JSON", () => {
            const paragraph = new Paragraph({
                alignment: AlignmentType.END,
            });
            const tree = new Formatter().format(paragraph);
            expect(tree).to.deep.equal({
                "w:p": [
                    {
                        "w:pPr": [{ "w:jc": { _attr: { "w:val": "end" } } }],
                    },
                ],
            });
        });
    });

    describe("#distribute()", () => {
        it("should add distribute alignment to JSON", () => {
            const paragraph = new Paragraph({
                alignment: AlignmentType.DISTRIBUTE,
            });
            const tree = new Formatter().format(paragraph);
            expect(tree).to.deep.equal({
                "w:p": [
                    {
                        "w:pPr": [{ "w:jc": { _attr: { "w:val": "distribute" } } }],
                    },
                ],
            });
        });
    });

    describe("#justified()", () => {
        it("should add justified alignment to JSON", () => {
            const paragraph = new Paragraph({
                alignment: AlignmentType.JUSTIFIED,
            });
            const tree = new Formatter().format(paragraph);
            expect(tree).to.deep.equal({
                "w:p": [
                    {
                        "w:pPr": [{ "w:jc": { _attr: { "w:val": "both" } } }],
                    },
                ],
            });
        });
    });

    describe("#maxRightTabStop()", () => {
        it("should add right tab stop to JSON", () => {
            const paragraph = new Paragraph({
                tabStops: [
                    {
                        type: TabStopType.RIGHT,
                        position: TabStopPosition.MAX,
                    },
                ],
            });
            const tree = new Formatter().format(paragraph);
            expect(tree).to.deep.equal({
                "w:p": [
                    {
                        "w:pPr": [
                            {
                                "w:tabs": [
                                    {
                                        "w:tab": {
                                            _attr: {
                                                "w:pos": 9026,
                                                "w:val": "right",
                                            },
                                        },
                                    },
                                ],
                            },
                        ],
                    },
                ],
            });
        });
    });

    describe("#leftTabStop()", () => {
        it("should add leftTabStop to JSON", () => {
            const paragraph = new Paragraph({
                tabStops: [
                    {
                        type: TabStopType.LEFT,
                        position: 100,
                        leader: LeaderType.HYPHEN,
                    },
                ],
            });
            const tree = new Formatter().format(paragraph);
            expect(tree).to.deep.equal({
                "w:p": [
                    {
                        "w:pPr": [
                            {
                                "w:tabs": [
                                    {
                                        "w:tab": {
                                            _attr: {
                                                "w:pos": 100,
                                                "w:val": "left",
                                                "w:leader": "hyphen",
                                            },
                                        },
                                    },
                                ],
                            },
                        ],
                    },
                ],
            });
        });
    });

    describe("#rightTabStop()", () => {
        it("should add rightTabStop to JSON", () => {
            const paragraph = new Paragraph({
                tabStops: [
                    {
                        type: TabStopType.RIGHT,
                        position: 100,
                        leader: LeaderType.DOT,
                    },
                ],
            });
            const tree = new Formatter().format(paragraph);
            expect(tree).to.deep.equal({
                "w:p": [
                    {
                        "w:pPr": [
                            {
                                "w:tabs": [
                                    {
                                        "w:tab": {
                                            _attr: {
                                                "w:pos": 100,
                                                "w:val": "right",
                                                "w:leader": "dot",
                                            },
                                        },
                                    },
                                ],
                            },
                        ],
                    },
                ],
            });
        });
    });

    describe("#centerTabStop()", () => {
        it("should add centerTabStop to JSON", () => {
            const paragraph = new Paragraph({
                tabStops: [
                    {
                        type: TabStopType.CENTER,
                        position: 100,
                        leader: LeaderType.MIDDLE_DOT,
                    },
                ],
            });
            const tree = new Formatter().format(paragraph);
            expect(tree).to.deep.equal({
                "w:p": [
                    {
                        "w:pPr": [
                            {
                                "w:tabs": [
                                    {
                                        "w:tab": {
                                            _attr: {
                                                "w:pos": 100,
                                                "w:val": "center",
                                                "w:leader": "middleDot",
                                            },
                                        },
                                    },
                                ],
                            },
                        ],
                    },
                ],
            });
        });
    });

    describe("#contextualSpacing()", () => {
        it("should add contextualSpacing", () => {
            const paragraph = new Paragraph({
                contextualSpacing: true,
            });
            const tree = new Formatter().format(paragraph);
            expect(tree).to.deep.equal({
                "w:p": [
                    {
                        "w:pPr": [{ "w:contextualSpacing": {} }],
                    },
                ],
            });
        });
        it("should remove contextualSpacing", () => {
            const paragraph = new Paragraph({
                contextualSpacing: false,
            });
            const tree = new Formatter().format(paragraph);
            expect(tree).to.deep.equal({
                "w:p": [
                    {
                        "w:pPr": [{ "w:contextualSpacing": { _attr: { "w:val": false } } }],
                    },
                ],
            });
        });
    });

    describe("#thematicBreak()", () => {
        it("should add thematic break to JSON", () => {
            const paragraph = new Paragraph({
                thematicBreak: true,
            });
            const tree = new Formatter().format(paragraph);
            expect(tree).to.deep.equal({
                "w:p": [
                    {
                        "w:pPr": [
                            {
                                "w:pBdr": [
                                    {
                                        "w:bottom": {
                                            _attr: {
                                                "w:val": "single",
                                                "w:color": "auto",
                                                "w:space": 1,
                                                "w:sz": 6,
                                            },
                                        },
                                    },
                                ],
                            },
                        ],
                    },
                ],
            });
        });
    });

    describe("#paragraphBorders()", () => {
        it("should add a left and right border to a paragraph", () => {
            const paragraph = new Paragraph({
                border: {
                    left: {
                        color: "auto",
                        space: 1,
                        style: BorderStyle.SINGLE,
                        size: 6,
                    },
                    right: {
                        color: "auto",
                        space: 1,
                        style: BorderStyle.SINGLE,
                        size: 6,
                    },
                },
            });
            const tree = new Formatter().format(paragraph);
            expect(tree).to.deep.equal({
                "w:p": [
                    {
                        "w:pPr": [
                            {
                                "w:pBdr": [
                                    {
                                        "w:left": {
                                            _attr: {
                                                "w:color": "auto",
                                                "w:space": 1,
                                                "w:sz": 6,
                                                "w:val": "single",
                                            },
                                        },
                                    },
                                    {
                                        "w:right": {
                                            _attr: {
                                                "w:color": "auto",
                                                "w:space": 1,
                                                "w:sz": 6,
                                                "w:val": "single",
                                            },
                                        },
                                    },
                                ],
                            },
                        ],
                    },
                ],
            });
        });
    });

    describe("#pageBreak()", () => {
        it("should add page break to JSON", () => {
            const paragraph = new Paragraph({
                children: [new PageBreak()],
            });
            const tree = new Formatter().format(paragraph);
            expect(tree).to.deep.equal({
                "w:p": [
                    {
                        "w:r": [{ "w:br": { _attr: { "w:type": "page" } } }],
                    },
                ],
            });
        });
    });

    describe("#pageBreakBefore()", () => {
        it("should add page break before to JSON", () => {
            const paragraph = new Paragraph({
                pageBreakBefore: true,
            });
            const tree = new Formatter().format(paragraph);
            expect(tree).to.deep.equal({
                "w:p": [
                    {
                        "w:pPr": [
                            {
                                "w:pageBreakBefore": EMPTY_OBJECT,
                            },
                        ],
                    },
                ],
            });
        });
    });

    describe("#bullet()", () => {
        it("should default to 0 indent level if no bullet was specified", () => {
            const paragraph = new Paragraph({
                bullet: {
                    level: 0,
                },
            });
            const tree = new Formatter().format(paragraph);
            expect(tree).to.have.property("w:p").which.is.an("array").which.has.length.at.least(1);
            expect(tree["w:p"][0]).to.have.property("w:pPr").which.is.an("array").which.has.length.at.least(1);
            expect(tree["w:p"][0]["w:pPr"][0]).to.deep.equal({
                "w:pStyle": { _attr: { "w:val": "ListParagraph" } },
            });
        });

        it("should add list paragraph style to JSON", () => {
            const paragraph = new Paragraph({
                bullet: {
                    level: 0,
                },
            });
            const tree = new Formatter().format(paragraph);
            expect(tree).to.have.property("w:p").which.is.an("array").which.has.length.at.least(1);
            expect(tree["w:p"][0]).to.have.property("w:pPr").which.is.an("array").which.has.length.at.least(1);
            expect(tree["w:p"][0]["w:pPr"][0]).to.deep.equal({
                "w:pStyle": { _attr: { "w:val": "ListParagraph" } },
            });
        });

        it("it should add numbered properties", () => {
            const paragraph = new Paragraph({
                bullet: {
                    level: 1,
                },
            });
            const tree = new Formatter().format(paragraph);
            expect(tree).to.have.property("w:p").which.is.an("array").which.has.length.at.least(1);
            expect(tree["w:p"][0]).to.have.property("w:pPr").which.is.an("array").which.has.length.at.least(2);
            expect(tree["w:p"][0]["w:pPr"][1]).to.deep.equal({
                "w:numPr": [{ "w:ilvl": { _attr: { "w:val": 1 } } }, { "w:numId": { _attr: { "w:val": 1 } } }],
            });
        });
    });

    describe("#setNumbering", () => {
        it("should add list paragraph style to JSON", () => {
            const paragraph = new Paragraph({
                numbering: {
                    reference: "test id",
                    level: 0,
                },
            });
            const tree = new Formatter().format(paragraph);
            expect(tree).to.have.property("w:p").which.is.an("array").which.has.length.at.least(1);
            expect(tree["w:p"][0]).to.have.property("w:pPr").which.is.an("array").which.has.length.at.least(1);
            expect(tree["w:p"][0]["w:pPr"][0]).to.deep.equal({
                "w:pStyle": { _attr: { "w:val": "ListParagraph" } },
            });
        });

        it("should add a style to the list paragraph when provided", () => {
            const paragraph = new Paragraph({
                numbering: {
                    reference: "test id",
                    level: 0,
                },
                style: "myFancyStyle",
            });
            const tree = new Formatter().format(paragraph);
            expect(tree).to.have.property("w:p").which.is.an("array").which.has.length.at.least(1);
            expect(tree["w:p"][0]).to.have.property("w:pPr").which.is.an("array").which.has.length.at.least(1);
            expect(tree["w:p"][0]["w:pPr"][0]).to.deep.equal({
                "w:pStyle": { _attr: { "w:val": "myFancyStyle" } },
            });
        });

        it("should not add ListParagraph style to a list when using custom numbering", () => {
            const paragraph = new Paragraph({
                numbering: {
                    reference: "test id",
                    level: 0,
                    custom: true,
                },
            });
            const tree = new Formatter().format(paragraph);
            expect(tree).to.have.property("w:p").which.is.an("array").which.has.length.at.least(1);
            expect(tree["w:p"][0]).to.have.property("w:pPr").which.is.an("array").which.has.length.at.least(1);
            expect(tree["w:p"][0]["w:pPr"][0]).to.not.have.property("w:pStyle");
        });

        it("it should add numbered properties", () => {
            const paragraph = new Paragraph({
                numbering: {
                    reference: "test id",
                    level: 0,
                    instance: 4,
                },
            });
            const tree = new Formatter().format(paragraph);
            expect(tree).to.deep.equal({
                "w:p": [
                    {
                        "w:pPr": [
                            { "w:pStyle": { _attr: { "w:val": "ListParagraph" } } },
                            {
                                "w:numPr": [{ "w:ilvl": { _attr: { "w:val": 0 } } }, { "w:numId": { _attr: { "w:val": "{test id-4}" } } }],
                            },
                        ],
                    },
                ],
            });
        });

        it("should not add ListParagraph style when custom is true", () => {
            const paragraph = new Paragraph({
                numbering: {
                    reference: "test id",
                    level: 0,
                    custom: true,
                },
            });
            const tree = new Formatter().format(paragraph);
            expect(tree).to.deep.equal({
                "w:p": [
                    {
                        "w:pPr": [
                            {
                                "w:numPr": [{ "w:ilvl": { _attr: { "w:val": 0 } } }, { "w:numId": { _attr: { "w:val": "{test id-0}" } } }],
                            },
                        ],
                    },
                ],
            });
        });
    });

    it("it should add bookmark", () => {
        const paragraph = new Paragraph({
            children: [
                new Bookmark({
                    id: "test-id",
                    children: [new TextRun("test")],
                }),
            ],
        });
        const tree = new Formatter().format(paragraph);
        expect(tree).to.deep.equal({
            "w:p": [
                {
                    "w:bookmarkStart": {
                        _attr: {
                            "w:id": -101,
                            "w:name": "test-id",
                        },
                    },
                },
                {
                    "w:r": [
                        {
                            "w:t": [
                                {
                                    _attr: {
                                        "xml:space": "preserve",
                                    },
                                },
                                "test",
                            ],
                        },
                    ],
                },
                {
                    "w:bookmarkEnd": {
                        _attr: {
                            "w:id": -101,
                        },
                    },
                },
            ],
        });
    });

    describe("#style", () => {
        it("should set the paragraph style to the given styleId", () => {
            const paragraph = new Paragraph({
                style: "myFancyStyle",
            });
            const tree = new Formatter().format(paragraph);
            expect(tree).to.deep.equal({
                "w:p": [
                    {
                        "w:pPr": [{ "w:pStyle": { _attr: { "w:val": "myFancyStyle" } } }],
                    },
                ],
            });
        });
    });

    describe("#indent", () => {
        it("should set the paragraph indent to the given values", () => {
            const paragraph = new Paragraph({
                indent: { left: 720 },
            });
            const tree = new Formatter().format(paragraph);
            expect(tree).to.deep.equal({
                "w:p": [
                    {
                        "w:pPr": [{ "w:ind": { _attr: { "w:left": 720 } } }],
                    },
                ],
            });
        });
    });

    describe("#spacing", () => {
        it("should set the paragraph spacing to the given values", () => {
            const paragraph = new Paragraph({
                spacing: { before: 90, line: 50 },
            });
            const tree = new Formatter().format(paragraph);
            expect(tree).to.deep.equal({
                "w:p": [
                    {
                        "w:pPr": [{ "w:spacing": { _attr: { "w:before": 90, "w:line": 50 } } }],
                    },
                ],
            });
        });
    });

    describe("#keepLines", () => {
        it("should set the paragraph keepLines sub-component", () => {
            const paragraph = new Paragraph({
                keepLines: true,
            });
            const tree = new Formatter().format(paragraph);
            expect(tree).to.deep.equal({
                "w:p": [{ "w:pPr": [{ "w:keepLines": EMPTY_OBJECT }] }],
            });
        });
    });

    describe("#keepNext", () => {
        it("should set the paragraph keepNext sub-component", () => {
            const paragraph = new Paragraph({
                keepNext: true,
            });
            const tree = new Formatter().format(paragraph);
            expect(tree).to.deep.equal({
                "w:p": [{ "w:pPr": [{ "w:keepNext": EMPTY_OBJECT }] }],
            });
        });
    });

    describe("#bidirectional", () => {
        it("set paragraph right to left layout", () => {
            const paragraph = new Paragraph({
                bidirectional: true,
            });
            const tree = new Formatter().format(paragraph);
            expect(tree).to.deep.equal({
                "w:p": [{ "w:pPr": [{ "w:bidi": EMPTY_OBJECT }] }],
            });
        });
    });

    describe("#suppressLineNumbers", () => {
        it("should disable line numbers", () => {
            const paragraph = new Paragraph({
                suppressLineNumbers: true,
            });
            const tree = new Formatter().format(paragraph);
            expect(tree).to.deep.equal({
                "w:p": [{ "w:pPr": [{ "w:suppressLineNumbers": EMPTY_OBJECT }] }],
            });
        });
    });

    describe("#outlineLevel", () => {
        it("should set paragraph outline level to the given value", () => {
            const paragraph = new Paragraph({
                outlineLevel: 0,
            });
            const tree = new Formatter().format(paragraph);
            expect(tree).to.deep.equal({
                "w:p": [
                    {
                        "w:pPr": [{ "w:outlineLvl": { _attr: { "w:val": 0 } } }],
                    },
                ],
            });
        });
    });

    describe("#shading", () => {
        it("should set shading to the given value", () => {
            const paragraph = new Paragraph({
                shading: {
                    type: ShadingType.REVERSE_DIAGONAL_STRIPE,
                    color: "00FFFF",
                    fill: "FF0000",
                },
            });
            const tree = new Formatter().format(paragraph);
            expect(tree).to.deep.equal({
                "w:p": [
                    {
                        "w:pPr": [
                            {
                                "w:shd": {
                                    _attr: {
                                        "w:color": "00FFFF",
                                        "w:fill": "FF0000",
                                        "w:val": "reverseDiagStripe",
                                    },
                                },
                            },
                        ],
                    },
                ],
            });
        });
    });

    describe("#frame", () => {
        it("should set frame attribute", () => {
            const paragraph = new Paragraph({
                frame: {
                    position: {
                        x: 1000,
                        y: 3000,
                    },
                    width: 4000,
                    height: 1000,
                    anchor: {
                        horizontal: FrameAnchorType.MARGIN,
                        vertical: FrameAnchorType.MARGIN,
                    },
                    alignment: {
                        x: HorizontalPositionAlign.CENTER,
                        y: VerticalPositionAlign.TOP,
                    },
                },
            });
            const tree = new Formatter().format(paragraph);
            expect(tree).to.deep.equal({
                "w:p": [
                    {
                        "w:pPr": [
                            {
                                "w:framePr": {
                                    _attr: {
                                        "w:h": 1000,
                                        "w:hAnchor": "margin",
                                        "w:vAnchor": "margin",
                                        "w:w": 4000,
                                        "w:x": 1000,
                                        "w:xAlign": "center",
                                        "w:y": 3000,
                                        "w:yAlign": "top",
                                    },
                                },
                            },
                        ],
                    },
                ],
            });
        });
    });

    describe("#prepForXml", () => {
        it("should set Internal Hyperlink", () => {
            const paragraph = new Paragraph({
                children: [
                    new ExternalHyperlink({
                        children: [new TextRun("test")],
                        link: "http://www.google.com",
                    }),
                ],
            });
            const viewWrapperMock = {
                Relationships: {
                    createRelationship: () => ({}),
                },
            } as unknown as IViewWrapper;

            const file = {} as unknown as File;
            paragraph.prepForXml({
                viewWrapper: viewWrapperMock,
                file: file,
            });
            const tree = new Formatter().format(paragraph);
            expect(tree).to.deep.equal({
                "w:p": [
                    {
                        "w:hyperlink": [
                            {
                                _attr: {
                                    "r:id": "rIdtest-unique-id",
                                    "w:history": 1,
                                },
                            },
                            {
                                "w:r": [
                                    {
                                        "w:t": [
                                            {
                                                _attr: {
                                                    "xml:space": "preserve",
                                                },
                                            },
                                            "test",
                                        ],
                                    },
                                ],
                            },
                        ],
                    },
                ],
            });
        });
    });
});
