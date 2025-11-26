/**
 * Copyright 2024 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import { ReportHandler, Metric } from 'web-vitals';

const reportWebVitals = (onPerfEntry?: ReportHandler) => {
  if (onPerfEntry && onPerfEntry instanceof Function) {
    import('web-vitals').then(({ getCLS, getFID, getFCP, getLCP, getTTFB }) => {
      getCLS(onPerfEntry);
      getFID(onPerfEntry);
      getFCP(onPerfEntry);
      getLCP(onPerfEntry);
      getTTFB(onPerfEntry);
    });
  } else {
    // Default handler for logging performance metrics
    const logMetric = (metric: Metric) => {
      // Determine rating based on common thresholds
      const getRating = (name: string, value: number) => {
        switch (name) {
          case 'CLS':
            return value <= 0.1 ? 'good' : value <= 0.25 ? 'needs-improvement' : 'poor';
          case 'FID':
            return value <= 100 ? 'good' : value <= 300 ? 'needs-improvement' : 'poor';
          case 'FCP':
            return value <= 1800 ? 'good' : value <= 3000 ? 'needs-improvement' : 'poor';
          case 'LCP':
            return value <= 2500 ? 'good' : value <= 4000 ? 'needs-improvement' : 'poor';
          case 'TTFB':
            return value <= 800 ? 'good' : value <= 1800 ? 'needs-improvement' : 'poor';
          default:
            return 'unknown';
        }
      };

      console.log(`Web Vitals - ${metric.name}:`, {
        value: metric.value,
        rating: getRating(metric.name, metric.value),
        delta: metric.delta,
        id: metric.id,
      });

      // In production, you would send this to your analytics/monitoring service
      // Example: sendToAnalytics('web-vitals', metric);

      // For demo purposes, store in localStorage for inspection
      if (typeof window !== 'undefined' && window.localStorage) {
        const existingMetrics = JSON.parse(localStorage.getItem('web-vitals') || '[]');
        existingMetrics.push({
          name: metric.name,
          value: metric.value,
          rating: getRating(metric.name, metric.value),
          timestamp: new Date().toISOString(),
        });

        // Keep only last 50 metrics
        if (existingMetrics.length > 50) {
          existingMetrics.splice(0, existingMetrics.length - 50);
        }

        localStorage.setItem('web-vitals', JSON.stringify(existingMetrics));
      }
    };

    import('web-vitals').then(({ getCLS, getFID, getFCP, getLCP, getTTFB }) => {
      getCLS(logMetric);
      getFID(logMetric);
      getFCP(logMetric);
      getLCP(logMetric);
      getTTFB(logMetric);
    });
  }
};

export default reportWebVitals;
