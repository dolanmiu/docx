import { Run } from "@file/paragraph";
import { Seperator } from "./seperator";

export class SeperatorRun extends Run {
    public constructor() {
        super({});

        this.root.push(new Seperator());
    }
}
