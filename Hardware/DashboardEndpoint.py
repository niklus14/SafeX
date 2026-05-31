@app.get("/api/map")
async def get_map_data():

    # son məlumatları gətir

    return [
        {
            "device_id": "URN-001",
            "lat": 40.4093,
            "lng": 49.8671,
            "risk": 72
        }
    ]
#
