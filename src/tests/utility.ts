export class Utility {
    // tslint:disable-next-line:no-any
    public static jsonify(obj: object): any {
        const stringifiedJson = JSON.stringify(obj);
        return JSON.parse(stringifiedJson);
    }
}
