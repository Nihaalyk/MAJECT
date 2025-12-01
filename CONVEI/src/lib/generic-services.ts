/**
 * Generic Services - Rate Calculation Logic
 */

// Rate Calculation Service
export interface RateCalculationParams {
  origin?: string;
  destination?: string;
  weight?: string;
  service_type?: string;
  package_type?: string;
  is_international?: boolean;
}

export interface RateResult {
  rate: string;
  currency: string;
  service_type: string;
  estimated_delivery: string;
  breakdown?: {
    base_rate: number;
    additional_charges: number;
    total: number;
  };
}

// Base rates for different services
const baseRates = {
  "Basic": {
    domestic: 5.00,
    international: 20.00,
    weight_rate: 2.00, // per unit
    max_weight: 10.0 // kg
  },
  "Express": {
    domestic: 10.00,
    international: 35.00,
    weight_rate: 3.00, // per unit
    max_weight: 30.0 // kg
  },
  "Economy": {
    domestic: 3.00,
    international: 15.00,
    weight_rate: 1.50, // per unit
    max_weight: 5.0 // kg
  },
  "Premium": {
    domestic: 15.00,
    international: 50.00,
    weight_rate: 4.00, // per unit
    max_weight: 30.0 // kg
  }
};

// Cache for rate calculations
const rateCalculationCache = new Map<string, RateResult>();

export const calculatePostageRate = (params: RateCalculationParams & { language?: 'en' | 'kn' }): RateResult => {
  const {
    origin = "",
    destination = "",
    weight = "1",
    service_type = "Basic",
    is_international = false,
    language = 'en'
  } = params;

  // Create cache key
  const cacheKey = `${origin}-${destination}-${weight}-${service_type}-${is_international}`;
  
  // Check cache first
  if (rateCalculationCache.has(cacheKey)) {
    return rateCalculationCache.get(cacheKey)!;
  }

  // Parse weight - convert grams to kg if needed
  let weightInKg = parseFloat(weight.replace(/[^\d.]/g, '')) || 1;
  if (weight.toLowerCase().includes('g') && !weight.toLowerCase().includes('kg')) {
    weightInKg = weightInKg / 1000; // Convert grams to kg
  }
  
  // Get base rate configuration
  const serviceConfig = baseRates[service_type as keyof typeof baseRates] || baseRates["Basic"];
  
  // Calculate base rate
  let baseRate = is_international ? serviceConfig.international : serviceConfig.domestic;
  
  // Calculate additional charges based on weight
  const additionalCharges = Math.max(0, weightInKg - 1) * serviceConfig.weight_rate;
  
  const totalRate = baseRate + additionalCharges;
  
  // Determine estimated delivery based on language
  let estimatedDelivery = "";
  if (is_international) {
    estimatedDelivery = language === 'en' ? "5-10 working days" : "5-10 ಕೆಲಸದ ದಿನಗಳು";
  } else {
    switch (service_type) {
      case "Express":
        estimatedDelivery = language === 'en' ? "1-2 working days" : "1-2 ಕೆಲಸದ ದಿನಗಳು";
        break;
      case "Premium":
        estimatedDelivery = language === 'en' ? "Same day delivery" : "ಅದೇ ದಿನದ ವಿತರಣೆ";
        break;
      case "Basic":
        estimatedDelivery = language === 'en' ? "3-5 working days" : "3-5 ಕೆಲಸದ ದಿನಗಳು";
        break;
      case "Economy":
        estimatedDelivery = language === 'en' ? "5-7 working days" : "5-7 ಕೆಲಸದ ದಿನಗಳು";
        break;
      default:
        estimatedDelivery = language === 'en' ? "3-5 working days" : "3-5 ಕೆಲಸದ ದಿನಗಳು";
    }
  }
  
  const result: RateResult = {
    rate: totalRate.toFixed(2),
    currency: "USD",
    service_type,
    estimated_delivery: estimatedDelivery,
    breakdown: {
      base_rate: baseRate,
      additional_charges: additionalCharges,
      total: totalRate
    }
  };

  // Cache the result (limit cache size to prevent memory issues)
  if (rateCalculationCache.size > 50) {
    const firstKey = rateCalculationCache.keys().next().value;
    if (firstKey) {
      rateCalculationCache.delete(firstKey);
    }
  }
  rateCalculationCache.set(cacheKey, result);
  
  return result;
};

