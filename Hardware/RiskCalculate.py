def calculate_risk(data):

    score = 0

    if data.gas_level > 300:
        score += 40

    if data.water_level > 50:
        score += 30

    if abs(data.tilt_x) > 5:
        score += 15

    if abs(data.tilt_y) > 5:
        score += 15

    if data.vibration > 20:
        score += 20

    return min(score, 100)
#
