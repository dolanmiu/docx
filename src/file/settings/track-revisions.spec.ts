import { expect } from "chai";
import { Formatter } from "export/formatter";
import { TrackRevisions } from "file/settings/track-revisions";

import { EMPTY_OBJECT } from "file/xml-components";

describe("TrackRevisions", () => {
    describe("#constructor", () => {
        it("creates an initially empty property object", () => {
            const trackRevisions = new TrackRevisions();

            const tree = new Formatter().format(trackRevisions);
            expect(tree).to.deep.equal({ "w:trackRevisions": EMPTY_OBJECT });
        });
    });
});
