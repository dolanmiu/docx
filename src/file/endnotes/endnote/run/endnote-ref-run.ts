import { EndnoteReference, Run } from "@file/paragraph";

export class EndnoteRefRun extends Run {
    public constructor() {
        super({
            style: "EndnoteReference",
        });

        this.root.push(new EndnoteReference());
    }
}
