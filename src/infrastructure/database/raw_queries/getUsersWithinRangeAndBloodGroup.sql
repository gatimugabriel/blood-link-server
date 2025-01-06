WITH params AS (
    SELECT 40.7128 AS lat,
        -74.0060 AS lon,
        100000 AS radius,
        'AB+'::user_bloodgroup_enum AS blood_group
)
SELECT id,
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
FROM "user",
    params
WHERE ST_DWithin(
        "lastKnownLocation"::geography,
        ST_SetSRID(ST_MakePoint(params.lon, params.lat), 4326)::geography,
        params.radius
    )
    AND "bloodGroup" = params.blood_group
ORDER BY distance_meters;


--  2
WITH params AS (
    SELECT 
        40.7128 AS lat,
        -74.0060 AS lon,
        5000 AS radius,
        'AB+'::text AS requested_blood_group
)
SELECT DISTINCT u.id,
    u."firstName",
    u."lastName",
    u.email,
    u."bloodGroup",
    u.status,
    ST_AsText(u."lastKnownLocation") as location,
    ST_Distance(
        u."lastKnownLocation"::geography,
        ST_SetSRID(ST_MakePoint(params.lon, params.lat), 4326)::geography
    ) AS distance_meters
FROM "user" u,
    params
WHERE ST_DWithin(
        u."lastKnownLocation"::geography,
        ST_SetSRID(ST_MakePoint(params.lon, params.lat), 4326)::geography,
        params.radius
    )
    AND u."bloodGroup" IN ('A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-')
    AND u.status = 'active'
    AND (u."lastDonationDate" IS NULL OR u."lastDonationDate" < NOW() - INTERVAL '56 days')
    AND NOT EXISTS (
        SELECT 1
        FROM "donation_request" dr
        WHERE dr."userId" = u.id
            AND dr.status = 'open'
            AND dr."requestFor" = 'self'
    )
ORDER BY distance_meters;


-- 3
WITH params AS (
    SELECT 
        40.7128 AS lat,
        -74.0060 AS lon,
        100000 AS radius,
        'AB+'::text AS requested_blood_group
)
SELECT DISTINCT u.id,
    u."firstName",
    u."lastName",
    u.email,
    u."bloodGroup",
    u.status,
    ST_AsText(u."lastKnownLocation") as location,
    ROUND(
        CAST(
            ST_Distance(
                u."lastKnownLocation"::geography,
                ST_SetSRID(ST_MakePoint(params.lon, params.lat), 4326)::geography
            ) AS numeric
        ), 2
    ) AS distance_meters,
    ROUND(
        CAST(
            ST_Distance(
                u."lastKnownLocation"::geography,
                ST_SetSRID(ST_MakePoint(params.lon, params.lat), 4326)::geography
            ) / 1000 AS numeric
        ), 2
    ) AS distance_km
FROM "user" u,
    params
WHERE ST_DWithin(
        u."lastKnownLocation"::geography,
        ST_SetSRID(ST_MakePoint(params.lon, params.lat), 4326)::geography,
        params.radius
    )
    AND u."bloodGroup" IN ('A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-')
    AND u.status = 'active'
    AND (u."lastDonationDate" IS NULL OR u."lastDonationDate" < NOW() - INTERVAL '56 days')
    AND NOT EXISTS (
        SELECT 1
        FROM "donation_request" dr
        WHERE dr."userId" = u.id
            AND dr.status = 'open'
            AND dr."requestFor" = 'self'
    )
ORDER BY distance_meters;
