CREATE TABLE sensor_readings (
    id SERIAL PRIMARY KEY,

    device_id VARCHAR(50),

    latitude DOUBLE PRECISION,
    longitude DOUBLE PRECISION,

    temperature FLOAT,
    humidity FLOAT,

    gas_level FLOAT,
    water_level FLOAT,

    tilt_x FLOAT,
    tilt_y FLOAT,

    vibration FLOAT,

    risk_score INTEGER,

    created_at TIMESTAMP DEFAULT NOW()
);
--
