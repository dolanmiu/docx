import * as _ from "lodash";

export class Formatter {

    private xmlKeyDictionary = {
        p: 'w:p',
        t: 'w:t',
        color: 'w:color',
        space: 'w:space',
        sz: 'w:sz',
        val: 'w:val',
        type: 'w:type',
        ilvl: 'w:ilvl',
        numId: 'w:numId',
        pBdr: 'w:pBdr',
        jc: 'w:jc',
        r: 'w:r',
        pPr: 'w:pPr',
        pStyle: 'w:pStyle',
        numPr: 'w:numPr',
        b: 'w:b',
        i: 'w:i',
        u: 'w:u',
        rPr: 'w:rPr'
    };

    format(input: any): Object {
        var newJson = this.jsonify(input);

        this.deepTraverseJson(newJson, (parent, value, key) => {
            if (isNaN(key)) {
                var newKey = this.getReplacementKey(key);
                parent[newKey] = parent[key];
                if (newKey !== key) {
                    delete parent[key];
                } else {
                    console.error("Key is not in dictionary:" + key);
                }
            }
        });
        
        newJson = this.clenseProperties(newJson);

        return newJson;
    }

    private clenseProperties(input: any): Object {
        var newJson = this.jsonify(input);

        this.deepTraverseJson(newJson, (parent, value, key) => {
            if (key === "properties") {
                delete parent[key];
            }
        });
        
        return newJson
    }

    private jsonify(obj: Object): Object {
        var stringifiedJson = JSON.stringify(obj);
        return JSON.parse(stringifiedJson);
    }

    private deepTraverseJson(json: Object, lambda: (json: any, value: any, key: any) => void): void {
        _.forOwn(json, (value, key) => {
            if (_.isObject(value)) {
                this.deepTraverseJson(value, lambda);
            }
            lambda(json, value, key);
        });
    }

    private getReplacementKey(key: string): string {
        var newKey = this.xmlKeyDictionary[key];

        if (newKey !== undefined) {
            return newKey;
        } else {
            return key;
        }
    }

}