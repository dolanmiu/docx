import { describe, expect, it } from "vitest";

import { type PresetShapeType, getOoxmlShapeName, isConnectorShapeType } from "./preset-shape-type";

describe("getOoxmlShapeName", () => {
    it("should map readable names to their OOXML names", () => {
        expect(getOoxmlShapeName("rectangle")).to.equal("rect");
        expect(getOoxmlShapeName("roundedRectangle")).to.equal("roundRect");
        expect(getOoxmlShapeName("ribbonUp")).to.equal("ribbon2");
        expect(getOoxmlShapeName("elbowConnector")).to.equal("bentConnector3");
    });

    it("should keep names that are the same in OOXML", () => {
        expect(getOoxmlShapeName("ellipse")).to.equal("ellipse");
        expect(getOoxmlShapeName("flowChartProcess")).to.equal("flowChartProcess");
    });

    it("should suggest the readable name for an OOXML name", () => {
        expect(() => getOoxmlShapeName("roundRect" as PresetShapeType)).to.throw(
            'Invalid shape type "roundRect". Did you mean "roundedRectangle"?',
        );
    });

    it("should throw on a name that is not a preset shape", () => {
        expect(() => getOoxmlShapeName("toString" as PresetShapeType)).to.throw('Invalid shape type "toString".');
    });
});

describe("isConnectorShapeType", () => {
    it("should treat lines and connectors as connectors", () => {
        expect(isConnectorShapeType("line")).to.equal(true);
        expect(isConnectorShapeType("straightConnector")).to.equal(true);
        expect(isConnectorShapeType("elbowConnector")).to.equal(true);
        expect(isConnectorShapeType("curvedConnectorFourBends")).to.equal(true);
    });

    it("should not treat other shapes as connectors", () => {
        expect(isConnectorShapeType("rectangle")).to.equal(false);
        expect(isConnectorShapeType("rightArrow")).to.equal(false);
        expect(isConnectorShapeType("flowChartConnector")).to.equal(false);
    });
});
