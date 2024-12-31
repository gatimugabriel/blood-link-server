WITH params AS (
    SELECT
        40.7128 AS lat,
        -74.0060 AS lon,
        5000 AS radius,
        'A-'::user_bloodgroup_enum AS blood_group
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
    AND "bloodGroup" = params.blood_group
ORDER BY
    distance_meters;
