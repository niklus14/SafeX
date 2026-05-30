from fastapi import FastAPI

app = FastAPI()

@app.post("/api/sensors/upload")
async def upload_sensor_data(data: SensorReading):

    risk_score = calculate_risk(data)

    # PostgreSQL insert

    return {
        "status": "success",
        "risk_score": risk_score
    }