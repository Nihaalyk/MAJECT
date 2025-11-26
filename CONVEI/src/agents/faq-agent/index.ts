/**
 * FAQ Agent Module
 * Exports for easy importing and dependency injection
 */

export { FAQAgent, type FAQAgentConfig, type FAQResponse } from './FAQAgent';
export { 
  faqDatabase, 
  searchFAQ, 
  getFAQByCategory, 
  getFAQCategories, 
  getFAQById, 
  getRandomFAQs,
  type FAQItem 
} from './faq-database';
