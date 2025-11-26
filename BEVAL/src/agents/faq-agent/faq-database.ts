/**
 * FAQ Database for POS Malaysia Services
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

// Comprehensive FAQ Data for POS Malaysia
export const faqDatabase: FAQItem[] = [
  // General Services
  {
    id: "general_001",
    category: "Perkhidmatan Umum",
    question: "Apa itu Pos Laju?",
    answer: "Pos Laju adalah perkhidmatan penghantaran ekspres POS Malaysia yang menawarkan penghantaran pantas dan selamat untuk dokumen dan bungkusan di seluruh Malaysia dan antarabangsa. Perkhidmatan ini menggunakan sistem tracking yang canggih untuk memantau perjalanan bungkusan anda.",
    keywords: ["pos laju", "ekspres", "penghantaran pantas", "tracking"],
    // English version
    question_en: "What is Pos Laju?",
    answer_en: "Pos Laju is POS Malaysia's express delivery service that offers fast and secure delivery for documents and packages throughout Malaysia and internationally. This service uses an advanced tracking system to monitor your package's journey.",
    keywords_en: ["pos laju", "express", "fast delivery", "tracking"]
  },
  {
    id: "general_002", 
    category: "Perkhidmatan Umum",
    question: "Apa perbezaan antara Pos Laju, Pos Biasa, dan Pos Ekspres?",
    answer: "Pos Laju: Penghantaran 1-2 hari bekerja dengan tracking penuh. Pos Biasa: Penghantaran 3-5 hari bekerja, lebih murah untuk bungkusan ringan. Pos Ekspres: Penghantaran sama hari atau keesokan hari untuk kawasan tertentu dengan kos premium.",
    keywords: ["perbezaan", "jenis perkhidmatan", "pos biasa", "pos ekspres"],
    question_en: "What's the difference between Pos Laju, Pos Biasa, and Pos Ekspres?",
    answer_en: "Pos Laju: 1-2 working days delivery with full tracking. Pos Biasa: 3-5 working days delivery, cheaper for light packages. Pos Ekspres: Same day or next day delivery for certain areas with premium cost.",
    keywords_en: ["difference", "service types", "pos biasa", "pos ekspres"]
  },
  {
    id: "general_003",
    category: "Perkhidmatan Umum", 
    question: "Boleh ke hantar makanan melalui pos?",
    answer: "Ya, makanan boleh dihantar melalui pos dengan syarat dibungkus dengan betul dan mematuhi peraturan keselamatan makanan. Makanan yang mudah rosak seperti daging segar, ikan, atau produk tenusu tidak digalakkan. Gunakan bekas bertebat dan label yang sesuai.",
    keywords: ["makanan", "food", "bungkusan makanan", "keselamatan makanan"],
    question_en: "Can I send food through the mail?",
    answer_en: "Yes, food can be sent through the mail provided it's properly packaged and complies with food safety regulations. Perishable foods like fresh meat, fish, or dairy products are not recommended. Use insulated containers and appropriate labeling.",
    keywords_en: ["food", "mail", "food packaging", "food safety"]
  },

  // Tracking and Delivery
  {
    id: "tracking_001",
    category: "Tracking & Penghantaran",
    question: "Macam mana nak track bungkusan saya?",
    answer: "Anda boleh track bungkusan anda menggunakan nombor tracking yang diberikan. Masuk ke laman web POS Malaysia (www.pos.com.my) atau gunakan aplikasi mobile POS Malaysia. Masukkan nombor tracking untuk melihat status terkini bungkusan anda.",
    keywords: ["track", "tracking", "nombor tracking", "status bungkusan"],
    question_en: "How can I track my package?",
    answer_en: "You can track your package using the tracking number provided. Visit the POS Malaysia website (www.pos.com.my) or use the POS Malaysia mobile app. Enter the tracking number to see the current status of your package.",
    keywords_en: ["track", "tracking", "tracking number", "package status"]
  },
  {
    id: "tracking_002",
    category: "Tracking & Penghantaran",
    question: "Berapa lama masa penghantaran Pos Laju?",
    answer: "Pos Laju domestik biasanya mengambil masa 1-2 hari bekerja, manakala penghantaran antarabangsa bergantung pada destinasi, biasanya 3-7 hari bekerja. Masa penghantaran mungkin berbeza mengikut lokasi dan musim.",
    keywords: ["masa penghantaran", "berapa lama", "domestik", "antarabangsa"],
    question_en: "How long does Pos Laju delivery take?",
    answer_en: "Pos Laju domestic delivery typically takes 1-2 working days, while international delivery depends on the destination, usually 3-7 working days. Delivery times may vary by location and season.",
    keywords_en: ["delivery time", "how long", "domestic", "international"]
  },
  {
    id: "tracking_003",
    category: "Tracking & Penghantaran",
    question: "Apa yang berlaku jika bungkusan saya hilang?",
    answer: "Jika bungkusan anda hilang, sila hubungi pusat khidmat pelanggan POS Malaysia di 1-300-300-300 atau buat aduan melalui laman web. Kami akan menyiasat dan memberikan ganti rugi mengikut terma dan syarat yang ditetapkan.",
    keywords: ["hilang", "lost", "aduan", "ganti rugi", "siasatan"],
    question_en: "What happens if my package is lost?",
    answer_en: "If your package is lost, please contact POS Malaysia customer service at 1-300-300-300 or file a complaint through the website. We will investigate and provide compensation according to the terms and conditions set.",
    keywords_en: ["lost", "missing", "complaint", "compensation", "investigation"]
  },

  // Weight and Size Limits
  {
    id: "limits_001",
    category: "Had Berat & Saiz",
    question: "Berapa berat maksimum untuk Pos Biasa?",
    answer: "Pos Biasa boleh menghantar bungkusan sehingga 2kg untuk domestik dan 1kg untuk antarabangsa. Untuk bungkusan yang lebih berat, gunakan Pos Laju atau Pos Ekspres yang boleh menghantar sehingga 30kg.",
    keywords: ["berat maksimum", "had berat", "2kg", "1kg", "30kg"],
    question_en: "What's the maximum weight for Pos Biasa?",
    answer_en: "Pos Biasa can send packages up to 2kg for domestic and 1kg for international. For heavier packages, use Pos Laju or Pos Ekspres which can send up to 30kg.",
    keywords_en: ["maximum weight", "weight limit", "2kg", "1kg", "30kg"]
  },
  {
    id: "limits_002",
    category: "Had Berat & Saiz",
    question: "Apa saiz maksimum untuk bungkusan?",
    answer: "Saiz maksimum untuk bungkusan adalah 60cm x 60cm x 60cm dengan berat maksimum 30kg. Untuk bungkusan yang lebih besar, sila hubungi pusat khidmat pelanggan untuk perkhidmatan khas.",
    keywords: ["saiz maksimum", "60cm", "dimensi", "bungkusan besar"],
    question_en: "What's the maximum size for packages?",
    answer_en: "The maximum size for packages is 60cm x 60cm x 60cm with a maximum weight of 30kg. For larger packages, please contact customer service for special services.",
    keywords_en: ["maximum size", "60cm", "dimensions", "large packages"]
  },

  // International Services
  {
    id: "international_001",
    category: "Perkhidmatan Antarabangsa",
    question: "Boleh hantar ke negara mana sahaja?",
    answer: "POS Malaysia menyediakan perkhidmatan penghantaran ke lebih 200 negara di seluruh dunia. Sila semak senarai negara yang disokong di laman web rasmi atau hubungi pusat khidmat pelanggan untuk maklumat terkini.",
    keywords: ["antarabangsa", "negara", "200 negara", "senarai negara"],
    question_en: "Which countries can I send to?",
    answer_en: "POS Malaysia provides delivery services to over 200 countries worldwide. Please check the list of supported countries on the official website or contact customer service for the latest information.",
    keywords_en: ["international", "countries", "200 countries", "country list"]
  },
  {
    id: "international_002",
    category: "Perkhidmatan Antarabangsa",
    question: "Apa dokumen yang diperlukan untuk penghantaran antarabangsa?",
    answer: "Untuk penghantaran antarabangsa, anda perlu mengisi borang kastam (Customs Declaration Form) dan menyediakan invois atau resit. Beberapa item mungkin memerlukan permit khas atau sijil kesihatan.",
    keywords: ["dokumen", "kastam", "customs", "permit", "sijil kesihatan"],
    question_en: "What documents are required for international shipping?",
    answer_en: "For international shipping, you need to fill out a customs declaration form and provide an invoice or receipt. Some items may require special permits or health certificates.",
    keywords_en: ["documents", "customs", "declaration", "permit", "health certificate"]
  },

  // Payment and Pricing
  {
    id: "payment_001",
    category: "Bayaran & Harga",
    question: "Macam mana nak bayar kos penghantaran?",
    answer: "Anda boleh bayar kos penghantaran dengan tunai di kaunter POS Malaysia, kad kredit/debit, atau melalui aplikasi mobile. Untuk penghantaran COD (Cash on Delivery), penerima akan bayar kos penghantaran semasa menerima bungkusan.",
    keywords: ["bayar", "payment", "tunai", "kad kredit", "COD", "cash on delivery"],
    question_en: "How can I pay for shipping costs?",
    answer_en: "You can pay shipping costs with cash at POS Malaysia counters, credit/debit cards, or through the mobile app. For COD (Cash on Delivery), the recipient will pay the shipping cost when receiving the package.",
    keywords_en: ["pay", "payment", "cash", "credit card", "COD", "cash on delivery"]
  },
  {
    id: "payment_002",
    category: "Bayaran & Harga",
    question: "Boleh dapat diskaun untuk penghantaran?",
    answer: "POS Malaysia menawarkan diskaun untuk pelanggan korporat dan penghantaran pukal. Sila hubungi pasukan jualan korporat untuk maklumat lanjut tentang program diskaun yang tersedia.",
    keywords: ["diskaun", "discount", "korporat", "pukal", "program diskaun"],
    question_en: "Can I get discounts for shipping?",
    answer_en: "POS Malaysia offers discounts for corporate customers and bulk shipping. Please contact the corporate sales team for more information about available discount programs.",
    keywords_en: ["discount", "corporate", "bulk", "discount programs"]
  },

  // Additional FAQ items for better coverage
  {
    id: "service_001",
    category: "Perkhidmatan Umum",
    question: "Apa itu Pos Biasa?",
    answer: "Pos Biasa adalah perkhidmatan penghantaran standard POS Malaysia yang menawarkan kos yang lebih rendah untuk penghantaran domestik dan antarabangsa. Sesuai untuk dokumen dan bungkusan ringan yang tidak memerlukan penghantaran segera.",
    keywords: ["pos biasa", "standard", "kos rendah", "dokumen"],
    question_en: "What is Pos Biasa?",
    answer_en: "Pos Biasa is POS Malaysia's standard delivery service that offers lower costs for domestic and international shipping. Suitable for documents and light packages that don't require immediate delivery.",
    keywords_en: ["pos biasa", "standard", "low cost", "documents"]
  },
  {
    id: "service_002",
    category: "Perkhidmatan Umum",
    question: "Apa itu Pos Ekspres?",
    answer: "Pos Ekspres adalah perkhidmatan penghantaran terpantas POS Malaysia yang menawarkan penghantaran sama hari atau keesokan hari untuk kawasan tertentu. Sesuai untuk dokumen dan bungkusan yang memerlukan penghantaran segera.",
    keywords: ["pos ekspres", "terpantas", "sama hari", "keesokan hari"],
    question_en: "What is Pos Ekspres?",
    answer_en: "Pos Ekspres is POS Malaysia's fastest delivery service that offers same-day or next-day delivery for certain areas. Suitable for documents and packages that require immediate delivery.",
    keywords_en: ["pos ekspres", "fastest", "same day", "next day"]
  },

  // New Service Types - Economy
  {
    id: "economy_001",
    category: "Perkhidmatan Economy",
    question: "Apa itu perkhidmatan Economy?",
    answer: "Perkhidmatan Economy adalah pilihan paling ekonomik untuk penghantaran domestik dan antarabangsa. Menawarkan kos yang sangat rendah dengan masa penghantaran 5-7 hari bekerja. Sesuai untuk bungkusan yang tidak memerlukan penghantaran segera dan ingin menjimatkan kos.",
    keywords: ["economy", "ekonomik", "kos rendah", "5-7 hari", "jimat kos"],
    question_en: "What is Economy service?",
    answer_en: "Economy service is the most cost-effective option for domestic and international shipping. Offers very low rates with 5-7 working days delivery time. Suitable for packages that don't require immediate delivery and want to save costs.",
    keywords_en: ["economy", "cost effective", "low rates", "5-7 days", "save costs"]
  },
  {
    id: "economy_002",
    category: "Perkhidmatan Economy",
    question: "Bila sesuai guna perkhidmatan Economy?",
    answer: "Perkhidmatan Economy sesuai untuk: 1) Bungkusan ringan (hingga 2kg), 2) Dokumen yang tidak mendesak, 3) Barang yang tidak mudah rosak, 4) Penghantaran pukal dengan kos terhad, 5) Pelanggan yang mementingkan kos berbanding kelajuan.",
    keywords: ["sesuai", "bungkusan ringan", "dokumen", "tidak mendesak", "pukal"],
    question_en: "When is Economy service suitable?",
    answer_en: "Economy service is suitable for: 1) Light packages (up to 2kg), 2) Non-urgent documents, 3) Non-perishable items, 4) Bulk shipping with limited budget, 5) Customers prioritizing cost over speed.",
    keywords_en: ["suitable", "light packages", "documents", "non-urgent", "bulk"]
  },

  // New Service Types - Express
  {
    id: "express_001",
    category: "Perkhidmatan Express",
    question: "Apa itu perkhidmatan Express?",
    answer: "Perkhidmatan Express adalah perkhidmatan penghantaran terpantas POS Malaysia yang menawarkan penghantaran sama hari untuk kawasan tertentu. Dengan kos premium, perkhidmatan ini menjamin penghantaran dalam masa 4-8 jam untuk destinasi yang disokong.",
    keywords: ["express", "terpantas", "sama hari", "4-8 jam", "premium"],
    question_en: "What is Express service?",
    answer_en: "Express service is POS Malaysia's fastest delivery service that offers same-day delivery for certain areas. With premium pricing, this service guarantees delivery within 4-8 hours for supported destinations.",
    keywords_en: ["express", "fastest", "same day", "4-8 hours", "premium"]
  },
  {
    id: "express_002",
    category: "Perkhidmatan Express",
    question: "Kawasan mana yang disokong untuk Express?",
    answer: "Perkhidmatan Express tersedia untuk kawasan utama seperti Kuala Lumpur, Petaling Jaya, Shah Alam, Subang Jaya, dan bandar-bandar besar lain di Semenanjung Malaysia. Sila hubungi pusat khidmat pelanggan untuk senarai lengkap kawasan yang disokong.",
    keywords: ["kawasan", "disokong", "kl", "pj", "shah alam", "subang jaya"],
    question_en: "Which areas are supported for Express?",
    answer_en: "Express service is available for major areas like Kuala Lumpur, Petaling Jaya, Shah Alam, Subang Jaya, and other major cities in Peninsular Malaysia. Please contact customer service for the complete list of supported areas.",
    keywords_en: ["areas", "supported", "kl", "pj", "shah alam", "subang jaya"]
  },

  // New Service Types - Islamic
  {
    id: "islamic_001",
    category: "Perkhidmatan Islamic",
    question: "Apa itu perkhidmatan Islamic?",
    answer: "Perkhidmatan Islamic adalah perkhidmatan penghantaran yang mematuhi prinsip-prinsip Islam dan bersijil Halal. Sesuai untuk penghantaran makanan Halal, produk kosmetik Halal, dan barang-barang yang memerlukan jaminan kesucian mengikut syariah.",
    keywords: ["islamic", "halal", "sijil halal", "makanan halal", "syariah"],
    question_en: "What is Islamic service?",
    answer_en: "Islamic service is a delivery service that complies with Islamic principles and is Halal certified. Suitable for Halal food delivery, Halal cosmetic products, and items requiring purity assurance according to Shariah.",
    keywords_en: ["islamic", "halal", "halal certified", "halal food", "shariah"]
  },
  {
    id: "islamic_002",
    category: "Perkhidmatan Islamic",
    question: "Apa kelebihan perkhidmatan Islamic?",
    answer: "Kelebihan perkhidmatan Islamic: 1) Bersijil Halal dari JAKIM, 2) Proses penghantaran mengikut prinsip Islam, 3) Kakitangan terlatih dalam penanganan produk Halal, 4) Jaminan kesucian dan kebersihan, 5) Sesuai untuk perniagaan Halal dan Muslim.",
    keywords: ["kelebihan", "jakim", "prinsip islam", "kakitangan terlatih", "perniagaan halal"],
    question_en: "What are the advantages of Islamic service?",
    answer_en: "Advantages of Islamic service: 1) Halal certified by JAKIM, 2) Delivery process follows Islamic principles, 3) Staff trained in Halal product handling, 4) Guarantee of purity and cleanliness, 5) Suitable for Halal and Muslim businesses.",
    keywords_en: ["advantages", "jakim", "islamic principles", "trained staff", "halal business"]
  },

  // Packaging and Handling
  {
    id: "packaging_001",
    category: "Pembungkusan & Penanganan",
    question: "Macam mana nak bungkus bungkusan dengan betul?",
    answer: "Untuk pembungkusan yang betul: 1) Gunakan kotak yang kuat dan sesuai saiz, 2) Bungkus item dengan bubble wrap atau kertas, 3) Isi ruang kosong dengan padding, 4) Tutup kotak dengan pita yang kuat, 5) Label alamat dengan jelas dan lengkap.",
    keywords: ["bungkus", "kotak", "bubble wrap", "padding", "label alamat"],
    question_en: "How to package items correctly?",
    answer_en: "For proper packaging: 1) Use strong and appropriately sized boxes, 2) Wrap items with bubble wrap or paper, 3) Fill empty spaces with padding, 4) Seal box with strong tape, 5) Label address clearly and completely.",
    keywords_en: ["package", "box", "bubble wrap", "padding", "address label"]
  },
  {
    id: "packaging_002",
    category: "Pembungkusan & Penanganan",
    question: "Apa item yang dilarang dihantar?",
    answer: "Item yang dilarang: 1) Bahan letupan dan mudah terbakar, 2) Bahan kimia berbahaya, 3) Senjata dan amunisi, 4) Dadah dan bahan terlarang, 5) Wang tunai dan barang berharga, 6) Haiwan hidup, 7) Makanan yang mudah rosak tanpa pembungkusan khas.",
    keywords: ["dilarang", "letupan", "kimia", "senjata", "dadah", "haiwan hidup"],
    question_en: "What items are prohibited for shipping?",
    answer_en: "Prohibited items: 1) Explosive and flammable materials, 2) Dangerous chemicals, 3) Weapons and ammunition, 4) Drugs and illegal substances, 5) Cash and valuables, 6) Live animals, 7) Perishable food without special packaging.",
    keywords_en: ["prohibited", "explosive", "chemicals", "weapons", "drugs", "live animals"]
  },

  // Customer Service
  {
    id: "customer_001",
    category: "Khidmat Pelanggan",
    question: "Macam mana nak hubungi khidmat pelanggan?",
    answer: "Anda boleh hubungi khidmat pelanggan POS Malaysia melalui: 1) Talian panas: 1-300-300-300 (24 jam), 2) Email: customer@pos.com.my, 3) Live chat di laman web, 4) Aplikasi mobile POS Malaysia, 5) Lawatan ke kaunter POS Malaysia terdekat.",
    keywords: ["hubungi", "khidmat pelanggan", "talian panas", "email", "live chat"],
    question_en: "How to contact customer service?",
    answer_en: "You can contact POS Malaysia customer service via: 1) Hotline: 1-300-300-300 (24 hours), 2) Email: customer@pos.com.my, 3) Live chat on website, 4) POS Malaysia mobile app, 5) Visit nearest POS Malaysia counter.",
    keywords_en: ["contact", "customer service", "hotline", "email", "live chat"]
  },
  {
    id: "customer_002",
    category: "Khidmat Pelanggan",
    question: "Berapa lama masa respons khidmat pelanggan?",
    answer: "Masa respons khidmat pelanggan: 1) Talian panas: Segera, 2) Email: 24-48 jam, 3) Live chat: Dalam 5 minit, 4) Aplikasi mobile: 1-2 jam, 5) Aduan formal: 3-5 hari bekerja. Masa respons mungkin berbeza mengikut jenis pertanyaan.",
    keywords: ["masa respons", "segera", "24-48 jam", "5 minit", "aduan formal"],
    question_en: "What is customer service response time?",
    answer_en: "Customer service response time: 1) Hotline: Immediate, 2) Email: 24-48 hours, 3) Live chat: Within 5 minutes, 4) Mobile app: 1-2 hours, 5) Formal complaints: 3-5 working days. Response time may vary by inquiry type.",
    keywords_en: ["response time", "immediate", "24-48 hours", "5 minutes", "formal complaints"]
  },

  // Business Services
  {
    id: "business_001",
    category: "Perkhidmatan Perniagaan",
    question: "Apa perkhidmatan untuk perniagaan?",
    answer: "POS Malaysia menawarkan perkhidmatan khas untuk perniagaan: 1) Akaun korporat dengan diskaun, 2) Penghantaran pukal, 3) Pickup service, 4) API integration, 5) Laporan penghantaran, 6) Insurans bungkusan, 7) Perkhidmatan kastam untuk eksport/import.",
    keywords: ["perniagaan", "korporat", "diskaun", "pukal", "pickup", "api"],
    question_en: "What services are available for businesses?",
    answer_en: "POS Malaysia offers special services for businesses: 1) Corporate accounts with discounts, 2) Bulk shipping, 3) Pickup service, 4) API integration, 5) Delivery reports, 6) Package insurance, 7) Customs services for export/import.",
    keywords_en: ["business", "corporate", "discounts", "bulk", "pickup", "api"]
  },
  {
    id: "business_002",
    category: "Perkhidmatan Perniagaan",
    question: "Macam mana nak buka akaun korporat?",
    answer: "Untuk buka akaun korporat: 1) Sediakan dokumen perniagaan (SSM, lesen perniagaan), 2) Isi borang permohonan di laman web, 3) Hantar dokumen yang diperlukan, 4) Tunggu kelulusan (3-5 hari bekerja), 5) Aktifkan akaun dan nikmati diskaun korporat.",
    keywords: ["akaun korporat", "ssm", "lesen perniagaan", "borang", "kelulusan"],
    question_en: "How to open a corporate account?",
    answer_en: "To open a corporate account: 1) Prepare business documents (SSM, business license), 2) Fill application form on website, 3) Submit required documents, 4) Wait for approval (3-5 working days), 5) Activate account and enjoy corporate discounts.",
    keywords_en: ["corporate account", "ssm", "business license", "form", "approval"]
  },

  // Insurance and Claims
  {
    id: "insurance_001",
    category: "Insurans & Tuntutan",
    question: "Boleh dapat insurans untuk bungkusan?",
    answer: "Ya, POS Malaysia menawarkan insurans bungkusan untuk melindungi barang berharga. Insurans tersedia untuk nilai sehingga RM10,000 dengan premium yang berpatutan. Sila nyatakan nilai barang semasa membuat penghantaran dan bayar premium insurans.",
    keywords: ["insurans", "bungkusan", "barang berharga", "rm10000", "premium"],
    question_en: "Can I get insurance for packages?",
    answer_en: "Yes, POS Malaysia offers package insurance to protect valuable items. Insurance is available for values up to RM10,000 with reasonable premiums. Please declare item value when shipping and pay insurance premium.",
    keywords_en: ["insurance", "package", "valuable items", "rm10000", "premium"]
  },
  {
    id: "insurance_002",
    category: "Insurans & Tuntutan",
    question: "Macam mana nak buat tuntutan insurans?",
    answer: "Untuk buat tuntutan insurans: 1) Laporkan kehilangan/kerosakan dalam 7 hari, 2) Isi borang tuntutan dengan lengkap, 3) Sediakan bukti nilai barang (resit, invois), 4) Hantar dokumen yang diperlukan, 5) Tunggu proses siasatan (14-30 hari), 6) Terima ganti rugi jika layak.",
    keywords: ["tuntutan", "insurans", "7 hari", "borang", "bukti nilai", "ganti rugi"],
    question_en: "How to make an insurance claim?",
    answer_en: "To make an insurance claim: 1) Report loss/damage within 7 days, 2) Fill claim form completely, 3) Provide proof of item value (receipt, invoice), 4) Submit required documents, 5) Wait for investigation process (14-30 days), 6) Receive compensation if eligible.",
    keywords_en: ["claim", "insurance", "7 days", "form", "proof of value", "compensation"]
  },

  // Technology and Digital Services
  {
    id: "tech_001",
    category: "Teknologi & Digital",
    question: "Apa aplikasi mobile POS Malaysia?",
    answer: "Aplikasi mobile POS Malaysia menawarkan: 1) Tracking bungkusan real-time, 2) Kalkulator kos penghantaran, 3) Booking pickup service, 4) Pembayaran online, 5) Notifikasi status penghantaran, 6) Sejarah penghantaran, 7) Lokasi kaunter POS terdekat.",
    keywords: ["aplikasi", "mobile", "tracking", "kalkulator", "booking", "pembayaran"],
    question_en: "What is the POS Malaysia mobile app?",
    answer_en: "POS Malaysia mobile app offers: 1) Real-time package tracking, 2) Shipping cost calculator, 3) Pickup service booking, 4) Online payment, 5) Delivery status notifications, 6) Shipping history, 7) Nearest POS counter locations.",
    keywords_en: ["app", "mobile", "tracking", "calculator", "booking", "payment"]
  },
  {
    id: "tech_002",
    category: "Teknologi & Digital",
    question: "Boleh guna API untuk integrasi sistem?",
    answer: "Ya, POS Malaysia menyediakan API untuk integrasi sistem perniagaan. API membolehkan: 1) Kalkulasi kos automatik, 2) Penciptaan waybill, 3) Tracking status, 4) Laporan penghantaran, 5) Pengurusan akaun. Hubungi pasukan teknikal untuk dokumentasi API.",
    keywords: ["api", "integrasi", "sistem", "waybill", "laporan", "dokumentasi"],
    question_en: "Can I use API for system integration?",
    answer_en: "Yes, POS Malaysia provides API for business system integration. API enables: 1) Automatic cost calculation, 2) Waybill creation, 3) Status tracking, 4) Delivery reports, 5) Account management. Contact technical team for API documentation.",
    keywords_en: ["api", "integration", "system", "waybill", "reports", "documentation"]
  },

  // Special Services
  {
    id: "special_001",
    category: "Perkhidmatan Khas",
    question: "Apa itu COD (Cash on Delivery)?",
    answer: "COD atau Cash on Delivery membolehkan penerima membayar semasa menerima bungkusan. Sesuai untuk perniagaan online. Caj COD: RM3-5 bergantung pada nilai bungkusan. Wang akan dikembalikan kepada pengirim dalam 3-5 hari bekerja. Maksimum nilai COD adalah RM5,000.",
    keywords: ["cod", "cash on delivery", "bayar semasa terima", "rm5000", "perniagaan online"],
    question_en: "What is COD (Cash on Delivery)?",
    answer_en: "COD or Cash on Delivery allows recipients to pay upon receiving the package. Suitable for online businesses. COD charges: RM3-5 depending on package value. Money will be returned to sender within 3-5 working days. Maximum COD value is RM5,000.",
    keywords_en: ["cod", "cash on delivery", "pay on receipt", "rm5000", "online business"]
  },
  {
    id: "special_002",
    category: "Perkhidmatan Khas",
    question: "Apa itu Pickup Service?",
    answer: "Pickup Service membolehkan kurier POS Malaysia mengambil bungkusan dari lokasi anda. Caj pickup: RM5-10 bergantung kawasan. Tempah minimum 24 jam lebih awal. Tersedia untuk kawasan urban. Minimum berat 1kg untuk pickup service. Hubungi 1-300-300-300 untuk tempahan.",
    keywords: ["pickup", "ambil bungkusan", "kurier", "tempahan", "24 jam"],
    question_en: "What is Pickup Service?",
    answer_en: "Pickup Service allows POS Malaysia couriers to collect packages from your location. Pickup charges: RM5-10 depending on area. Book minimum 24 hours in advance. Available for urban areas. Minimum weight 1kg for pickup service. Call 1-300-300-300 to book.",
    keywords_en: ["pickup", "collect packages", "courier", "booking", "24 hours"]
  },
  {
    id: "special_003",
    category: "Perkhidmatan Khas",
    question: "Apa itu perkhidmatan Flexipack?",
    answer: "Flexipack adalah perkhidmatan bungkusan fleksibel untuk e-commerce. Termasuk kotak berkualiti tinggi dengan branding. Kos berpatutan untuk penghantaran pukal. Termasuk insurans percuma sehingga RM100. Sesuai untuk penjual online yang hantar banyak bungkusan setiap hari.",
    keywords: ["flexipack", "e-commerce", "kotak", "branding", "pukal", "penjual online"],
    question_en: "What is Flexipack service?",
    answer_en: "Flexipack is a flexible packaging service for e-commerce. Includes high-quality boxes with branding. Affordable cost for bulk shipping. Includes free insurance up to RM100. Suitable for online sellers shipping many packages daily.",
    keywords_en: ["flexipack", "e-commerce", "boxes", "branding", "bulk", "online sellers"]
  },

  // Tracking Issues
  {
    id: "tracking_004",
    category: "Tracking & Penghantaran",
    question: "Kenapa tracking tidak update?",
    answer: "Tracking mungkin tidak update kerana: 1) Sistem delay 2-4 jam, 2) Bungkusan dalam transit, 3) Scan tidak berjaya di hub, 4) Masalah teknikal. Jika tidak update lebih 24 jam, hubungi khidmat pelanggan. Tracking akan update apabila bungkusan sampai ke setiap hub.",
    keywords: ["tracking tidak update", "delay", "system", "scan", "hub"],
    question_en: "Why isn't tracking updating?",
    answer_en: "Tracking may not update due to: 1) System delay 2-4 hours, 2) Package in transit, 3) Unsuccessful scan at hub, 4) Technical issues. If not updated for more than 24 hours, contact customer service. Tracking updates when package arrives at each hub.",
    keywords_en: ["tracking not updating", "delay", "system", "scan", "hub"]
  },
  {
    id: "tracking_005",
    category: "Tracking & Penghantaran",
    question: "Apa maksud 'Out for Delivery'?",
    answer: "'Out for Delivery' bermaksud bungkusan anda sudah dihantar oleh kurier dan akan sampai pada hari yang sama. Kurier akan cuba hantar antara 9am-6pm. Pastikan ada orang di alamat penghantaran. Jika tiada, kurier akan tinggalkan notis untuk ambil di pejabat pos.",
    keywords: ["out for delivery", "kurier", "hari sama", "notis", "pejabat pos"],
    question_en: "What does 'Out for Delivery' mean?",
    answer_en: "'Out for Delivery' means your package has been dispatched by courier and will arrive on the same day. Courier will attempt delivery between 9am-6pm. Ensure someone is at the delivery address. If not, courier will leave notice to collect at post office.",
    keywords_en: ["out for delivery", "courier", "same day", "notice", "post office"]
  },
  {
    id: "tracking_006",
    category: "Tracking & Penghantaran",
    question: "Berapa kali kurier cuba hantar?",
    answer: "Kurier akan cuba hantar 2 kali. Cubaan pertama: Hari dijadualkan. Cubaan kedua: Keesokan hari. Jika kedua-dua kali gagal, bungkusan akan dihantar ke pejabat pos terdekat untuk diambil. Notis akan ditinggalkan di alamat. Tempoh simpan: 7 hari. Selepas itu akan pulang ke pengirim.",
    keywords: ["kurier", "2 kali", "gagal", "pejabat pos", "7 hari", "pulang pengirim"],
    question_en: "How many times will courier attempt delivery?",
    answer_en: "Courier will attempt delivery 2 times. First attempt: Scheduled day. Second attempt: Next day. If both fail, package will be sent to nearest post office for collection. Notice will be left at address. Storage period: 7 days. After that will return to sender.",
    keywords_en: ["courier", "2 times", "failed", "post office", "7 days", "return sender"]
  },

  // International Shipping
  {
    id: "international_003",
    category: "Perkhidmatan Antarabangsa",
    question: "Apa itu EMS (Express Mail Service)?",
    answer: "EMS adalah perkhidmatan penghantaran antarabangsa ekspres dengan jaminan masa penghantaran. Penghantaran ke lebih 190 negara dalam 2-7 hari. Termasuk tracking penuh dan insurans asas. Lebih cepat dari Pos Biasa Antarabangsa. Sesuai untuk dokumen penting dan bungkusan yang memerlukan penghantaran pantas.",
    keywords: ["ems", "express mail", "antarabangsa", "190 negara", "2-7 hari", "tracking"],
    question_en: "What is EMS (Express Mail Service)?",
    answer_en: "EMS is an international express delivery service with guaranteed delivery time. Delivery to over 190 countries in 2-7 days. Includes full tracking and basic insurance. Faster than International Regular Post. Suitable for important documents and packages requiring fast delivery.",
    keywords_en: ["ems", "express mail", "international", "190 countries", "2-7 days", "tracking"]
  },
  {
    id: "international_004",
    category: "Perkhidmatan Antarabangsa",
    question: "Berapa lama kastam proses bungkusan?",
    answer: "Proses kastam biasanya ambil 1-3 hari bekerja. Faktor yang mempengaruhi: 1) Jenis barang, 2) Nilai bungkusan, 3) Kesempurnaan dokumen, 4) Pemeriksaan random. Untuk mempercepatkan: Isikan borang kastam dengan lengkap dan betul, sediakan invois yang jelas, declare nilai sebenar barang.",
    keywords: ["kastam", "proses", "1-3 hari", "dokumen", "invois", "declare nilai"],
    question_en: "How long does customs process packages?",
    answer_en: "Customs process typically takes 1-3 working days. Factors affecting: 1) Item type, 2) Package value, 3) Document completeness, 4) Random inspection. To expedite: Fill customs form completely and correctly, provide clear invoice, declare actual item value.",
    keywords_en: ["customs", "process", "1-3 days", "documents", "invoice", "declare value"]
  },
  {
    id: "international_005",
    category: "Perkhidmatan Antarabangsa",
    question: "Kena bayar cukai kastam ke?",
    answer: "Cukai kastam dikenakan jika nilai barang melebihi RM500 (de minimis value). Kadar cukai: 5-30% bergantung jenis barang. Kastam akan hubungi penerima untuk bayaran. Bayaran boleh dibuat online atau di pejabat kastam. Bungkusan akan dilepaskan selepas bayaran selesai. Simpan resit untuk rujukan.",
    keywords: ["cukai kastam", "rm500", "de minimis", "5-30%", "bayaran", "resit"],
    question_en: "Do I need to pay customs duty?",
    answer_en: "Customs duty is charged if item value exceeds RM500 (de minimis value). Duty rate: 5-30% depending on item type. Customs will contact recipient for payment. Payment can be made online or at customs office. Package will be released after payment completion. Keep receipt for reference.",
    keywords_en: ["customs duty", "rm500", "de minimis", "5-30%", "payment", "receipt"]
  },

  // Stamp and Postal Services
  {
    id: "stamp_001",
    category: "Setem & Perkhidmatan Pos",
    question: "Macam mana nak beli setem?",
    answer: "Setem boleh dibeli di: 1) Kaunter POS Malaysia, 2) Mesin layan diri, 3) Aplikasi mobile POS, 4) Portal online, 5) Ejen pos berlesen. Harga setem: Surat domestik RM0.60, Poskad RM0.30, Surat antarabangsa RM1.20-2.50. Setem khas dan koleksi juga tersedia.",
    keywords: ["setem", "beli", "rm0.60", "rm0.30", "domestik", "antarabangsa"],
    question_en: "How to buy stamps?",
    answer_en: "Stamps can be bought at: 1) POS Malaysia counters, 2) Self-service machines, 3) POS mobile app, 4) Online portal, 5) Licensed postal agents. Stamp prices: Domestic letter RM0.60, Postcard RM0.30, International letter RM1.20-2.50. Special and collectible stamps also available.",
    keywords_en: ["stamps", "buy", "rm0.60", "rm0.30", "domestic", "international"]
  },
  {
    id: "stamp_002",
    category: "Setem & Perkhidmatan Pos",
    question: "Apa itu Pos Berdaftar?",
    answer: "Pos Berdaftar menyediakan bukti penghantaran dan tandatangan penerima. Sesuai untuk dokumen penting, sijil, atau barang berharga. Termasuk insurans asas RM50. Tracking penuh tersedia. Kos tambahan RM5-8 di atas harga pos biasa. Tempoh penghantaran sama seperti perkhidmatan asas yang dipilih.",
    keywords: ["pos berdaftar", "bukti", "tandatangan", "insurans rm50", "tracking", "dokumen penting"],
    question_en: "What is Registered Post?",
    answer_en: "Registered Post provides proof of delivery and recipient signature. Suitable for important documents, certificates, or valuables. Includes basic insurance RM50. Full tracking available. Additional cost RM5-8 on top of basic postage. Delivery time same as selected basic service.",
    keywords_en: ["registered post", "proof", "signature", "insurance rm50", "tracking", "important documents"]
  },
  {
    id: "stamp_003",
    category: "Setem & Perkhidmatan Pos",
    question: "Boleh pos surat tanpa alamat pulangan?",
    answer: "Tidak digalakkan. Alamat pulangan penting jika: 1) Alamat penerima salah, 2) Penerima tidak dijumpai, 3) Surat tidak boleh dihantar. Tanpa alamat pulangan, surat akan hilang. Untuk keselamatan dan jaminan, sentiasa tulis alamat pulangan yang lengkap di bahagian atas kiri sampul surat.",
    keywords: ["alamat pulangan", "return address", "sampul surat", "tidak dijumpai", "hilang"],
    question_en: "Can I mail letters without return address?",
    answer_en: "Not recommended. Return address is important if: 1) Recipient address is wrong, 2) Recipient not found, 3) Letter cannot be delivered. Without return address, letter will be lost. For security and assurance, always write complete return address at top left of envelope.",
    keywords_en: ["return address", "envelope", "not found", "lost"]
  },

  // Mobile and Online Services
  {
    id: "online_001",
    category: "Perkhidmatan Online",
    question: "Boleh bayar online?",
    answer: "Ya, bayaran online tersedia melalui: 1) Aplikasi mobile POS Malaysia, 2) Portal web pos.com.my, 3) FPX (online banking), 4) Kad kredit/debit, 5) E-wallet (Touch 'n Go, GrabPay). Simpan resit elektronik untuk rujukan. Bayaran selamat dengan SSL encryption. Bonus: Dapat diskaun 5% untuk pembayaran online.",
    keywords: ["bayar online", "aplikasi", "fpx", "kad kredit", "e-wallet", "diskaun 5%"],
    question_en: "Can I pay online?",
    answer_en: "Yes, online payment available through: 1) POS Malaysia mobile app, 2) Web portal pos.com.my, 3) FPX (online banking), 4) Credit/debit cards, 5) E-wallets (Touch 'n Go, GrabPay). Keep electronic receipt for reference. Secure payment with SSL encryption. Bonus: Get 5% discount for online payments.",
    keywords_en: ["pay online", "app", "fpx", "credit card", "e-wallet", "5% discount"]
  },
  {
    id: "online_002",
    category: "Perkhidmatan Online",
    question: "Macam mana nak cetak label penghantaran?",
    answer: "Untuk cetak label penghantaran: 1) Log masuk ke akaun POS Malaysia online, 2) Pilih 'Create Shipment', 3) Masukkan maklumat pengirim dan penerima, 4) Pilih jenis perkhidmatan, 5) Bayar online, 6) Muat turun dan cetak label PDF, 7) Tampal pada bungkusan. Label termasuk barcode dan nombor tracking.",
    keywords: ["cetak label", "create shipment", "barcode", "tracking", "pdf", "tampal"],
    question_en: "How to print shipping labels?",
    answer_en: "To print shipping labels: 1) Log in to POS Malaysia online account, 2) Select 'Create Shipment', 3) Enter sender and recipient information, 4) Choose service type, 5) Pay online, 6) Download and print PDF label, 7) Affix to package. Label includes barcode and tracking number.",
    keywords_en: ["print labels", "create shipment", "barcode", "tracking", "pdf", "affix"]
  },

  // PO Box Services
  {
    id: "pobox_001",
    category: "Peti Surat (PO Box)",
    question: "Apa itu Peti Surat dan bagaimana nak sewa?",
    answer: "Peti Surat (PO Box) adalah kotak surat peribadi di pejabat pos untuk terima mel dengan selamat. Untuk sewa: 1) Pergi ke pejabat pos, 2) Isi borang permohonan, 3) Sediakan salinan IC/SSM, 4) Bayar yuran tahunan RM40-150 (bergantung saiz), 5) Terima kunci peti surat. Sesuai untuk perniagaan dan yang kerap terima surat.",
    keywords: ["peti surat", "po box", "sewa", "rm40-150", "tahunan", "kunci", "perniagaan"],
    question_en: "What is PO Box and how to rent?",
    answer_en: "PO Box is a personal mailbox at post office for secure mail receipt. To rent: 1) Go to post office, 2) Fill application form, 3) Prepare IC/SSM copy, 4) Pay annual fee RM40-150 (depends on size), 5) Receive PO Box key. Suitable for businesses and frequent mail recipients.",
    keywords_en: ["po box", "mailbox", "rent", "rm40-150", "annual", "key", "business"]
  },
  {
    id: "pobox_002",
    category: "Peti Surat (PO Box)",
    question: "Bila mel sampai ke Peti Surat?",
    answer: "Mel akan dimasukkan ke Peti Surat pada waktu bekerja pejabat pos (8am-5pm, Isnin-Jumaat; 8am-1pm, Sabtu). Mel domestik: 1-2 hari selepas dipos. Mel antarabangsa: 5-10 hari. Anda boleh semak Peti Surat anda pada bila-bila masa semasa pejabat pos buka. Notis akan diletakkan untuk bungkusan besar.",
    keywords: ["mel sampai", "waktu bekerja", "8am-5pm", "1-2 hari", "semak", "notis"],
    question_en: "When does mail arrive at PO Box?",
    answer_en: "Mail will be placed in PO Box during post office hours (8am-5pm, Monday-Friday; 8am-1pm, Saturday). Domestic mail: 1-2 days after posting. International mail: 5-10 days. You can check your PO Box anytime during post office hours. Notice will be placed for large packages.",
    keywords_en: ["mail arrival", "office hours", "8am-5pm", "1-2 days", "check", "notice"]
  },

  // Special Handling
  {
    id: "handling_001",
    category: "Pengendalian Khas",
    question: "Boleh hantar barang elektronik?",
    answer: "Ya, barang elektronik boleh dihantar dengan syarat: 1) Dibungkus dengan selamat (bubble wrap, foam), 2) Kotak yang kuat, 3) Label 'Fragile' ditampal, 4) Insurans disyorkan untuk nilai tinggi, 5) Bateri litium mesti dihantar berasingan atau ikut peraturan khas. Caj tambahan mungkin dikenakan untuk pengendalian khas.",
    keywords: ["elektronik", "fragile", "bubble wrap", "insurans", "bateri litium", "pengendalian khas"],
    question_en: "Can I send electronics?",
    answer_en: "Yes, electronics can be sent with conditions: 1) Safely packaged (bubble wrap, foam), 2) Strong box, 3) 'Fragile' label affixed, 4) Insurance recommended for high value, 5) Lithium batteries must be sent separately or follow special regulations. Additional charges may apply for special handling.",
    keywords_en: ["electronics", "fragile", "bubble wrap", "insurance", "lithium batteries", "special handling"]
  },
  {
    id: "handling_002",
    category: "Pengendalian Khas",
    question: "Macam mana nak hantar barang mudah pecah?",
    answer: "Untuk hantar barang mudah pecah: 1) Bungkus setiap item dengan bubble wrap tebal, 2) Gunakan kotak double wall, 3) Isi ruang kosong dengan peanut foam, 4) Tampal label 'FRAGILE' di semua sisi, 5) Ambil insurans, 6) Pilih perkhidmatan Express untuk pengendalian lebih berhati-hati. Premium fragile handling: Tambah RM5-10.",
    keywords: ["mudah pecah", "fragile", "bubble wrap", "double wall", "peanut foam", "premium handling"],
    question_en: "How to send fragile items?",
    answer_en: "To send fragile items: 1) Wrap each item with thick bubble wrap, 2) Use double wall box, 3) Fill empty space with peanut foam, 4) Affix 'FRAGILE' label on all sides, 5) Get insurance, 6) Choose Express service for more careful handling. Premium fragile handling: Add RM5-10.",
    keywords_en: ["fragile", "bubble wrap", "double wall", "peanut foam", "premium handling"]
  },

  // Environmental and Sustainability
  {
    id: "environment_001",
    category: "Alam Sekitar & Kelestarian",
    question: "Adakah POS Malaysia mesra alam?",
    answer: "Ya, POS Malaysia komited kepada kelestarian: 1) Kenderaan elektrik untuk penghantaran, 2) Kotak dan bungkusan daripada bahan kitar semula, 3) Program kitar semula setem dan amplop, 4) Penggunaan tenaga solar di pejabat pos terpilih, 5) Pengurangan penggunaan plastik. Pelanggan digalakkan gunakan bahan pembungkus mesra alam.",
    keywords: ["mesra alam", "kelestarian", "kitar semula", "elektrik", "solar", "plastik"],
    question_en: "Is POS Malaysia eco-friendly?",
    answer_en: "Yes, POS Malaysia is committed to sustainability: 1) Electric vehicles for delivery, 2) Boxes and packaging from recycled materials, 3) Stamp and envelope recycling program, 4) Solar power usage at selected post offices, 5) Plastic reduction. Customers encouraged to use eco-friendly packaging materials.",
    keywords_en: ["eco-friendly", "sustainability", "recycling", "electric", "solar", "plastic"]
  }
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
