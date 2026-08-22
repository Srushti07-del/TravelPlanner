import pytest
from services.route_optimizer import RouteOptimizer
from services.weather_service import WeatherService

def test_route_optimizer_distance():
    optimizer = RouteOptimizer()
    # Distance between two known coordinates (e.g., Panaji to Calangute in Goa ~15km)
    dist = optimizer.calculate_distance(15.4989, 73.8278, 15.5439, 73.7554)
    assert 5.0 < dist < 20.0

def test_route_optimizer_ordering():
    optimizer = RouteOptimizer()
    hotel = {"lat": 15.4989, "lng": 73.8278} # Panaji
    places = [
        {"name": "Far Place", "lat": 15.7000, "lng": 73.9000, "estimated_cost": 100, "duration_minutes": 60},
        {"name": "Near Place", "lat": 15.5050, "lng": 73.8300, "estimated_cost": 50, "duration_minutes": 30},
    ]
    optimized = optimizer.optimize_day_route(places, hotel)
    assert len(optimized) == 2
    assert optimized[0]["name"] == "Near Place"

def test_weather_classification():
    service = WeatherService()
    
    # Rainy forecast
    rain_data = {"description": "moderate rain", "temp_max": 28}
    res = service.classify_weather(rain_data)
    assert res["is_outdoor_suitable"] is False
    assert res["warning"] is not None
    
    # Sunny mild weather
    clear_data = {"description": "clear sky", "temp_max": 27}
    res = service.classify_weather(clear_data)
    assert res["is_outdoor_suitable"] is True
    assert res["warning"] is None

    # Extreme heat
    hot_data = {"description": "sunny", "temp_max": 42}
    res = service.classify_weather(hot_data)
    assert res["is_outdoor_suitable"] is False
    assert res["severity"] == "severe"
