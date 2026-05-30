def predict_failure(sensor_history):

    if (
        sensor_history["vibration_trend"] > 30
        and
        sensor_history["tilt_trend"] > 10
    ):
        return "HIGH RISK"

    return "NORMAL"