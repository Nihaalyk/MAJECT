/**
 * Rate Calculator Agent - Handles postage rate calculations
 */

import { calculatePostageRate, RateCalculationParams } from "../../lib/generic-services";
import { ConversationMemory } from "../../contexts/ConversationMemoryContext";

export interface RateCalculatorAgentConfig {
  language: 'en' | 'ms';
  memory: ConversationMemory;
}

export interface RateCalculationResponse {
  success: boolean;
  data: {
    complete: boolean;
    rate_info?: any;
    message: string;
    missing_fields?: string[];
  };
  error?: string;
}

export class RateCalculatorAgent {
  private config: RateCalculatorAgentConfig;

  constructor(config: RateCalculatorAgentConfig) {
    this.config = config;
  }

  /**
   * Process rate calculation request
   */
  async processRateCalculation(params: any): Promise<RateCalculationResponse> {
    try {
      const { language } = this.config;
      
      // Check for required fields
      const missingFields = this.checkMissingFields(params, language);
      
      if (missingFields.length > 0) {
        return {
          success: true,
          data: {
            complete: false,
            message: this.getMissingFieldsMessage(missingFields, language),
            missing_fields: missingFields
          }
        };
      }

      // Use memory to fill in missing information
      const enhancedParams = this.enhanceParamsWithMemory(params);
      
      // Calculate rate with language parameter
      const rateResult = calculatePostageRate({
        ...enhancedParams as RateCalculationParams,
        language
      });
      
      // Update memory with this calculation
      this.updateMemoryWithCalculation(enhancedParams, rateResult);
      
      const message = this.formatRateMessage(enhancedParams, rateResult, language);
      
      return {
        success: true,
        data: {
          complete: true,
          rate_info: rateResult,
          message
        }
      };
    } catch (error) {
      return {
        success: false,
        data: {
          complete: false,
          message: ""
        },
        error: error instanceof Error ? error.message : "Unknown error"
      };
    }
  }

  /**
   * Check for missing required fields
   */
  private checkMissingFields(params: any, language: 'en' | 'ms'): string[] {
    const missingFields: string[] = [];
    
    if (!params.origin) {
      missingFields.push(language === 'en' ? 'origin' : 'asal');
    }
    if (!params.destination) {
      missingFields.push(language === 'en' ? 'destination' : 'destinasi');
    }
    if (!params.weight) {
      missingFields.push(language === 'en' ? 'weight' : 'berat');
    }
    
    return missingFields;
  }

  /**
   * Enhance parameters with memory information
   */
  private enhanceParamsWithMemory(params: any): any {
    const { memory } = this.config;
    const { pendingInfo } = memory.currentContext;
    const { userPreferences } = memory;
    
    return {
      ...params,
      origin: params.origin || (pendingInfo as any).origin,
      destination: params.destination || (pendingInfo as any).destination,
      weight: params.weight || (pendingInfo as any).weight,
      service_type: params.service_type || (pendingInfo as any).serviceType || 'Basic',
      package_type: params.package_type || 'parcel'
    };
  }

  /**
   * Get message for missing fields
   */
  private getMissingFieldsMessage(missingFields: string[], language: 'en' | 'ms'): string {
    if (language === 'en') {
      return `I need more information to calculate the rate. Please provide the ${missingFields.join(', ')}.`;
    } else {
      return `Saya memerlukan maklumat lanjut untuk mengira kadar. Sila berikan ${missingFields.join(', ')}.`;
    }
  }

  /**
   * Format rate calculation message
   */
  private formatRateMessage(params: any, rateResult: any, language: 'en' | 'ms'): string {
    if (language === 'en') {
      return `The rate for ${params.service_type || 'Basic'} service is ${rateResult.currency} ${rateResult.rate}. Estimated delivery time: ${rateResult.estimated_delivery}.`;
    } else {
      return `Kadar untuk perkhidmatan ${params.service_type || 'Basic'} adalah ${rateResult.currency} ${rateResult.rate}. Anggaran masa penghantaran: ${rateResult.estimated_delivery}.`;
    }
  }

  /**
   * Update memory with calculation information
   */
  private updateMemoryWithCalculation(params: any, rateResult: any): void {
    // This would be called by the main agent to update memory
    // The actual memory update happens in the main agent
  }

  /**
   * Get agent name
   */
  getName(): string {
    return "Rate Calculator Agent";
  }

  /**
   * Get agent description
   */
  getDescription(): string {
    const { language } = this.config;
    
    if (language === 'en') {
      return "Calculates rates for services";
    } else {
      return "Mengira kadar untuk perkhidmatan";
    }
  }
}
