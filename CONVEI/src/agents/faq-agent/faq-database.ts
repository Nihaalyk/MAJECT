/**
 * FAQ Database - Generic Knowledge Base
 * Comprehensive knowledge base for RAG (Retrieval Augmented Generation)
 */

export interface FAQItem {
  id: string;
  category: string;
  question: string;
  answer: string;
  keywords: string[];
  // English version
  question_en?: string;
  answer_en?: string;
  keywords_en?: string[];
}

// Generic FAQ Database - Empty template for customization
export const faqDatabase: FAQItem[] = [
  // Add your FAQ items here
  // Example structure:
  // {
  //   id: "example_001",
  //   category: "General",
  //   question: "Example question?",
  //   answer: "Example answer.",
  //   keywords: ["example", "keyword"],
  //   question_en: "Example question?",
  //   answer_en: "Example answer.",
  //   keywords_en: ["example", "keyword"]
  // }
];

// Cache for FAQ search results
const faqSearchCache = new Map<string, FAQItem[]>();

// FAQ Search Function with caching
export const searchFAQ = (query: string, language: "en" | "ms" = "ms"): FAQItem[] => {
  const cacheKey = `${query.toLowerCase()}-${language}`;
  
  // Check cache first
  if (faqSearchCache.has(cacheKey)) {
    return faqSearchCache.get(cacheKey)!;
  }
  
  const queryLower = query.toLowerCase();
  
  const results = faqDatabase.filter(faq => {
    if (language === "en") {
      // Check English question
      if (faq.question_en && faq.question_en.toLowerCase().includes(queryLower)) return true;
      
      // Check English answer
      if (faq.answer_en && faq.answer_en.toLowerCase().includes(queryLower)) return true;
      
      // Check English keywords
      if (faq.keywords_en && faq.keywords_en.some(keyword => queryLower.includes(keyword.toLowerCase()))) return true;
    } else {
      // Check Malay question
      if (faq.question.toLowerCase().includes(queryLower)) return true;
      
      // Check Malay answer
      if (faq.answer.toLowerCase().includes(queryLower)) return true;
      
      // Check Malay keywords
      if (faq.keywords.some(keyword => queryLower.includes(keyword.toLowerCase()))) return true;
    }
    
    return false;
  }).map(faq => ({
    ...faq,
    // Return the appropriate language version
    question: language === "en" ? (faq.question_en || faq.question) : faq.question,
    answer: language === "en" ? (faq.answer_en || faq.answer) : faq.answer,
    keywords: language === "en" ? (faq.keywords_en || faq.keywords) : faq.keywords
  }));
  
  // Cache the results (limit cache size to prevent memory issues)
  if (faqSearchCache.size > 100) {
    const firstKey = faqSearchCache.keys().next().value;
    if (firstKey) {
      faqSearchCache.delete(firstKey);
    }
  }
  faqSearchCache.set(cacheKey, results);
  
  return results;
};

// Get FAQ by category
export const getFAQByCategory = (category: string): FAQItem[] => {
  return faqDatabase.filter(faq => faq.category === category);
};

// Get all categories
export const getFAQCategories = (): string[] => {
  return [...new Set(faqDatabase.map(faq => faq.category))];
};

// Get FAQ by ID
export const getFAQById = (id: string): FAQItem | undefined => {
  return faqDatabase.find(faq => faq.id === id);
};

// Get random FAQ items
export const getRandomFAQs = (count: number = 5): FAQItem[] => {
  const shuffled = [...faqDatabase].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
};
