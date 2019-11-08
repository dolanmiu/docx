import { ConcreteNumbering } from "file";

export class NumberingReplacer {
    public replace(xmlData: string, concreteNumberings: ConcreteNumbering[]): string {
        let currentXmlData = xmlData;

        for (const concreteNumbering of concreteNumberings) {
            if (!concreteNumbering.reference) {
                continue;
            }

            currentXmlData = currentXmlData.replace(new RegExp(`{${concreteNumbering.reference}}`, "g"), concreteNumbering.id.toString());
        }

        return currentXmlData;
    }
}
