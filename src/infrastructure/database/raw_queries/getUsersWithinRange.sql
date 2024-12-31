WITH params AS (
    SELECT
        40.5074 AS lat,
        -74.1278 AS lon,
        50000 AS radius
)

SELECT
    id,
    "firstName",
    "lastName",
    email,
    phone,
    "bloodGroup",
    ST_AsText("lastKnownLocation") AS last_known_location,
    ST_Distance(
        "lastKnownLocation"::geography,
        ST_SetSRID(ST_MakePoint(params.lon, params.lat), 4326)::geography
    ) AS distance_meters
FROM
    "user",
    params
WHERE
    ST_DWithin(
        "lastKnownLocation"::geography,
        ST_SetSRID(ST_MakePoint(params.lon, params.lat), 4326)::geography,
        params.radius
    )
ORDER BY
    distance_meters;
