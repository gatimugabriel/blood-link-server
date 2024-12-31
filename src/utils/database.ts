import { Point } from "typeorm/driver/types/GeoJsonTypes";

//  create a Point if given coordinates 
//@params latitude: number
//@params longitude: number
export function createPoint(latitude: number, longitude: number): Point {
    return {
        type: 'Point',
        coordinates: [longitude, latitude] 
    };
}
