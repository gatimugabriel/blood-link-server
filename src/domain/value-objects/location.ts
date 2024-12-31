import {Point} from "typeorm";

export class Location{
    constructor(public latitude: number, public longitude: number) {    }

    toGeoJson() {
        return {
            type: "Point",
            coordinates: [this.latitude, this.longitude]
        }
    }

    static fromGeoJson(point: Point) {
        return new Location(point.coordinates[0], point.coordinates[1])
    }
}
