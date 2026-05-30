from pydantic import BaseModel

class SensorReading(BaseModel):
    device_id: str

    latitude: float
    longitude: float

    temperature: float
    humidity: float

    gas_level: float
    water_level: float

    tilt_x: float
    tilt_y: float

    vibration: float