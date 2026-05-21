/**
 * Smart Agriculture Spray & Cultivation Advisor Engine
 * 
 * Performs high-fidelity agricultural weather analytics to determine:
 * 1. Spray Suitability Score (0-100) and Suitability Category (Excellent, Good, Moderate, Avoid)
 * 2. Optimal Spray Windows for the current day
 * 3. Fungal Disease Infection Risk (Apple Scab, Rust, Blights)
 * 4. Heat Stress, Frost, and Irrigation Advisories
 */

/**
 * Calculates a detailed spray suitability score between 0 and 100
 * along with specific agronomic reasons for any deductions.
 * 
 * Rules:
 * AVOID spraying if:
 * - Rain probability > 50%
 * - Wind speed > 20 km/h
 * - Temperature > 35°C
 * - Humidity > 90% or < 30% (pesticides vaporize too fast under extremely dry conditions)
 */
export function calculateSprayScore(temp, windSpeed, humidity, rainProb, uvIndex = 0) {
  let score = 100;
  const deductions = [];
  let forceAvoid = false;

  // 1. Rain Probability Constraints
  if (rainProb > 50) {
    score = 0;
    forceAvoid = true;
    deductions.push('High risk of rain wash-off (> 50% probability)');
  } else if (rainProb > 30) {
    score -= 30;
    deductions.push('Moderate risk of rain wash-off (30-50% probability)');
  } else if (rainProb > 10) {
    score -= 10;
    deductions.push('Slight risk of rain (10-30% probability)');
  }

  // 2. Wind Speed Constraints (km/h)
  if (windSpeed > 20) {
    score = 0;
    forceAvoid = true;
    deductions.push('High wind speed (> 20 km/h) causes severe chemical drift');
  } else if (windSpeed > 12) {
    score -= 30;
    deductions.push('Moderate wind speed (12-20 km/h) can cause moderate spray drift');
  } else if (windSpeed < 2) {
    score -= 15;
    deductions.push('Extremely low wind speed (< 2 km/h) may trigger chemical stagnation/vapor pockets');
  }

  // 3. Temperature Constraints (°C)
  if (temp > 35) {
    score = 0;
    forceAvoid = true;
    deductions.push('Extreme heat (> 35°C) causes rapid pesticide vaporization and crop phytotoxicity');
  } else if (temp > 30) {
    score -= 25;
    deductions.push('High temperature (30-35°C) increases droplet evaporation rate');
  } else if (temp < 5) {
    score = 0;
    forceAvoid = true;
    deductions.push('Near-freezing temperatures (< 5°C) restrict chemical absorption and crop metabolism');
  } else if (temp < 12) {
    score -= 20;
    deductions.push('Cool temperature (5-12°C) slows down system absorption');
  }

  // 4. Humidity Constraints (%)
  if (humidity > 90) {
    score = 0;
    forceAvoid = true;
    deductions.push('Extreme humidity (> 90%) prevents spray droplets from drying, causing chemical run-off');
  } else if (humidity > 80) {
    score -= 15;
    deductions.push('High humidity (80-90%) delays drying time');
  } else if (humidity < 30) {
    score = 0;
    forceAvoid = true;
    deductions.push('Extremely dry air (< 30%) causes instant droplet evaporation before reaching target');
  } else if (humidity < 50) {
    score -= 20;
    deductions.push('Dry air (30-50%) increases evaporation risks');
  }

  // 5. UV Index Constraints
  if (uvIndex >= 8) {
    score -= 15;
    deductions.push('Very High UV Index degrades photo-sensitive active chemicals rapidly');
  }

  // Final score clamping
  score = forceAvoid ? 0 : Math.max(0, Math.min(100, score));

  // Determine Suitability Category
  let category = 'Excellent';
  let color = '#2E7D32'; // Deep Green
  let description = 'Perfect spraying conditions. Spray efficiency is maximized.';

  if (score === 0) {
    category = 'Avoid Spraying';
    color = '#D32F2F'; // Crimson Red
    description = 'Do NOT spray today. Extremely unfavorable conditions will waste chemicals or harm crops.';
  } else if (score < 40) {
    category = 'Poor';
    color = '#E65100'; // Dark Orange
    description = 'Unsuitable conditions. Avoid spraying unless absolutely urgent.';
  } else if (score < 60) {
    category = 'Moderate';
    color = '#F57C00'; // Orange
    description = 'Sub-optimal spraying. Adjust spray droplet size larger to combat drift/evaporation.';
  } else if (score < 80) {
    category = 'Good';
    color = '#689F38'; // Light Green
    description = 'Favorable spraying conditions. Suitable for standard operation.';
  }

  return {
    score,
    category,
    color,
    description,
    deductions,
  };
}

/**
 * Processes hourly forecasts to identify highly suitable spray windows.
 * 
 * Returns optimal time ranges (e.g. "6:00 AM - 9:00 AM") or warning text.
 */
export function getBestSprayWindows(hourlyForecast = []) {
  if (!hourlyForecast || hourlyForecast.length === 0) {
    return {
      hasWindow: false,
      text: 'Hourly forecast unavailable to determine optimal spray timing.',
      windows: [],
    };
  }

  const suitableHours = [];

  // Evaluate each hour
  hourlyForecast.forEach((hour) => {
    // Format hour display (e.g. "6:00 AM")
    const dateObj = new Date(hour.time);
    const hourNum = dateObj.getHours();
    const ampm = hourNum >= 12 ? 'PM' : 'AM';
    const hour12 = hourNum % 12 || 12;
    const timeStr = `${hour12}:00 ${ampm}`;

    // Get the details
    const temp = hour.temp_c ?? hour.temp;
    const wind = hour.wind_kph ?? hour.wind;
    const humidity = hour.humidity;
    const rainProb = hour.will_it_rain ? 100 : (hour.chance_of_rain ?? 0);
    const uv = hour.uv ?? 0;

    const analysis = calculateSprayScore(temp, wind, humidity, rainProb, uv);

    if (analysis.score >= 60) {
      suitableHours.push({
        hour: hourNum,
        timeStr,
        score: analysis.score,
        category: analysis.category,
      });
    }
  });

  if (suitableHours.length === 0) {
    return {
      hasWindow: false,
      text: 'Avoid spraying today due to persistent adverse weather conditions (high wind, heat, or rain).',
      windows: [],
    };
  }

  // Group continuous hours into slots (windows)
  const windows = [];
  let currentStart = null;
  let currentPrev = null;

  // Sort by raw hour number
  suitableHours.sort((a, b) => a.hour - b.hour);

  suitableHours.forEach((item, index) => {
    if (currentStart === null) {
      currentStart = item;
      currentPrev = item;
    } else if (item.hour === currentPrev.hour + 1) {
      currentPrev = item; // continuous window
    } else {
      // gap detected, close previous window
      windows.push({
        start: currentStart.timeStr,
        end: getNextHourStr(currentPrev.hour),
        avgScore: Math.round((currentStart.score + currentPrev.score) / 2),
      });
      currentStart = item;
      currentPrev = item;
    }

    // handle last item
    if (index === suitableHours.length - 1) {
      windows.push({
        start: currentStart.timeStr,
        end: getNextHourStr(currentPrev.hour),
        avgScore: Math.round((currentStart.score + currentPrev.score) / 2),
      });
    }
  });

  // Generate recommendation summary
  let text = '';
  if (windows.length > 0) {
    const formattedWindows = windows.slice(0, 2).map(w => `${w.start} – ${w.end}`).join(', ');
    text = `Best spray timing today: ${formattedWindows}`;
  } else {
    text = 'Conditions are acceptable but inconsistent. Check hour-by-hour metrics.';
  }

  return {
    hasWindow: true,
    text,
    windows,
  };
}

function getNextHourStr(hour) {
  const next = (hour + 1) % 24;
  const ampm = next >= 12 ? 'PM' : 'AM';
  const hour12 = next % 12 || 12;
  return `${hour12}:00 ${ampm}`;
}

/**
 * Calculates risk levels for typical fungal plant diseases
 * based on persistent warmth and humidity thresholds.
 */
export function getFungalDiseaseRisk(temp, humidity, rainProb) {
  let riskScore = 0;
  const conditions = [];

  // Fungal diseases thrive in warm, humid, and damp environments
  // Apple scab, Rust, Late Blight, Early Blight
  if (humidity > 75) {
    riskScore += 40;
    conditions.push('High Humidity (> 75%) provides excellent micro-environment for spore germinations');
  } else if (humidity > 60) {
    riskScore += 15;
    conditions.push('Moderate humidity supports secondary spore spread');
  }

  if (temp >= 16 && temp <= 26) {
    riskScore += 40; // Optimal temp for most crop fungi
    conditions.push('Warm temperatures (16°C - 26°C) are highly optimal for mycelial growth');
  } else if (temp >= 10 && temp < 16) {
    riskScore += 15;
    conditions.push('Cool-mild temperatures slow, but do not stop, fungal progression');
  } else if (temp > 26 && temp <= 32) {
    riskScore += 10;
    conditions.push('Warmer temperatures limit spore activity of cold-loving fungi');
  }

  if (rainProb > 40) {
    riskScore += 20;
    conditions.push('High wetness probability provides liquid water film required for spores to anchor');
  }

  let riskLevel = 'Low';
  let color = '#2E7D32';
  let description = 'Weather conditions do not favor active fungal sporulation.';

  if (riskScore >= 80) {
    riskLevel = 'High';
    color = '#D32F2F';
    description = 'WARNING: Weather is highly conducive to fungal outbreaks (Apple Scab, Rust, and Blights). Increase field monitoring.';
  } else if (riskScore >= 40) {
    riskLevel = 'Moderate';
    color = '#F57C00';
    description = 'Mild risk of fungal spread. Leaf surfaces are damp. Maintain normal preventive schedules.';
  }

  return {
    score: riskScore,
    level: riskLevel,
    color,
    description,
    conditions,
  };
}

/**
 * Computes general farming insights based on instant metrics
 */
export function getFarmingAdvice(temp, windSpeed, humidity, rainProb, uvIndex = 0) {
  const alerts = [];

  // 1. Heat Stress
  if (temp > 35) {
    alerts.push({
      type: 'heat',
      title: 'Heat Stress Warning',
      desc: 'Temperatures exceed 35°C. Crops will suffer transpirational water loss. Irrigate deeply early in the morning and avoid physical leaf contact.',
      color: '#D32F2F',
      icon: 'thermometer-sharp',
    });
  }

  // 2. Frost Alert
  if (temp < 4) {
    alerts.push({
      type: 'frost',
      title: 'Frost Alert Warning',
      desc: 'Near-freezing temperatures (< 4°C) detected. High risk of cellular crop damage in cold-sensitive species. Cover vulnerable seedlings and apply mulch layer.',
      color: '#1976D2',
      icon: 'snow-outline',
    });
  }

  // 3. Fungal Spore Spread Alert
  if (humidity > 80 && temp >= 16 && temp <= 26) {
    alerts.push({
      type: 'fungus',
      title: 'Fungal Infection Alert',
      desc: 'Perfect weather for spore incubation. High humidity combined with warm temperatures increases infection risk of Apple Scab, Late Blight, and Leaf Rust.',
      color: '#D32F2F',
      icon: 'warning-outline',
    });
  }

  // 4. Irrigation Advice
  if (rainProb > 60) {
    alerts.push({
      type: 'irrigation',
      title: 'Irrigation Suspended',
      desc: 'Heavy rain predicted (> 60% probability). Suspend manual irrigation to avoid soil waterlogging, nutrient leaching, and root rot diseases.',
      color: '#1976D2',
      icon: 'water-outline',
    });
  } else if (temp > 32 && humidity < 40) {
    alerts.push({
      type: 'irrigation',
      title: 'Irrigation Required',
      desc: 'Hot and dry conditions. Crop evapotranspiration is very high. Ensure soil remains moist. Increase watering cycles.',
      color: '#F57C00',
      icon: 'water-sharp',
    });
  } else {
    alerts.push({
      type: 'irrigation',
      title: 'Standard Irrigation',
      desc: 'Stable atmospheric conditions. Maintain standard irrigation schedules based on specific crop stage requirements.',
      color: '#2E7D32',
      icon: 'checkmark-circle-outline',
    });
  }

  // 5. High Wind Spray Warning
  if (windSpeed > 20) {
    alerts.push({
      type: 'wind',
      title: 'High Drift Hazard',
      desc: `Wind is gusting at ${windSpeed} km/h. All spraying operations must be halted to prevent drift damage to adjacent crops or chemical wastage.`,
      color: '#D32F2F',
      icon: 'speedometer-outline',
    });
  }

  return alerts;
}
