import * as _ from "lodash";

export class Formatter {

    format(input: any) {
        var stringified = JSON.stringify(input);
        var newJson = JSON.parse(stringified);
        this.deepTraverseJson(newJson, (parent, value, key) => {
                //parent.blah = parent[key];

        });

        return newJson;
    }

    private deepTraverseJson(json, lambda: (json: any, value: any, key: string) => void) {
        _.forOwn(json, function(value, key) {
            if (_.isObject(value)) {
                this.deepTraverseJson(value, lambda);
                return;
            }
            lambda(json, value, key);
        });
    };
}