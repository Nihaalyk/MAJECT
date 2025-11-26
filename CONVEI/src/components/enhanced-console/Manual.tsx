import React from 'react';
import { useLanguage } from '../../contexts/LanguageContext';
import './Manual.scss';

const Manual: React.FC = () => {
  const { language } = useLanguage();

  const manualContent = {
    en: {
      title: "Quick Guide",
      subtitle: "Essential CES System Instructions",
      sections: [
        {
          title: "Getting Started",
          content: `
CES is an AI assistant for postal services. Use voice or text to ask about shipping rates, services, and general inquiries.

**Quick Setup:**
1. Click "Play Button" to start
2. Allow microphone access
3. Speak or type your questions

**Key Features:**
• Voice conversation with AI
• Rate calculations
• Multi-language support
• Service information
          `
        },
        {
          title: "Voice Use",
          content: `
**Voice Controls:**
• Connect/Disconnect: Start or end sessions
• Microphone: Mute/unmute input
• Speak naturally - AI responds automatically
• Voice activity detection stops AI when you finish

**Tips:**
• Speak clearly at normal volume
• Use microphone button to control input
          `
        },
        {
          title: "Text Input",
          content: `
**Text Options:**
• Type messages in chat field
• Use service cards for common tasks
• Enter sends message (Shift+Enter for new line)

**Console:**
• Advanced text input area
• View system logs and agent actions
          `
        },
        {
          title: "Services & Rates",
          content: `
**Available Services:**
• Express delivery (1-2 days)
• Standard delivery (3-5 days)
• Same-day delivery (urban areas)
• Economy delivery (5-7 days)
• International services

**Rate Calculation:**
• Provide from/to locations
• Specify weight in grams or kg
• Choose service type if known

**Examples:**
• "Cost to send 1kg from KL to Penang?"
• "Rate for express delivery to Johor?"
          `
        },
        {
          title: "Controls",
          content: `
**Main Controls:**
• Connect/Disconnect: Session control
• Microphone: Voice input control
• Settings: Voice and model selection
• CES Logo: Reset conversation

**Language:**
• EN/MS buttons switch language
• Setting persists across sessions
          `
        },
        {
          title: "Troubleshooting",
          content: `
**Connection Issues:**
• Check internet connection
• Verify API key is configured
• Refresh page if needed

**Audio Problems:**
• Allow microphone permissions
• Check audio device settings
• Try different browsers

**Rate Issues:**
• Provide complete location details
• Include package weight
• Use standard location names
          `
        }
      ]
    },
    ms: {
      title: "Panduan Ringkas",
      subtitle: "Arahan Penting Sistem CES",
      sections: [
        {
          title: "Bermula",
          content: `
CES adalah pembantu AI untuk perkhidmatan pos. Gunakan suara atau teks untuk bertanya tentang kadar penghantaran, perkhidmatan, dan pertanyaan umum.

**Persediaan Pantas:**
1. Klik "Connect" untuk bermula
2. Benarkan akses mikrofon
3. Bercakap atau taip soalan anda

**Ciri Utama:**
• Perbualan suara dengan AI
• Pengiraan kadar
• Sokongan berbilang bahasa
• Maklumat perkhidmatan
          `
        },
        {
          title: "Penggunaan Suara",
          content: `
**Kawalan Suara:**
• Connect/Disconnect: Mulakan atau tamat sesi
• Mikrofon: Bisu/tidak bisu input
• Bercakap secara semula jadi - AI bertindak balas automatik
• Pengesanan aktiviti suara hentikan AI apabila anda selesai

**Petua:**
• Bercakap dengan jelas pada volum normal
• Gunakan butang mikrofon untuk kawal input
          `
        },
        {
          title: "Input Teks",
          content: `
**Pilihan Teks:**
• Taip mesej dalam medan chat
• Gunakan kad perkhidmatan untuk tugas biasa
• Enter hantar mesej (Shift+Enter untuk baris baru)

**Konsol:**
• Kawasan input teks maju
• Lihat log sistem dan tindakan ejen
          `
        },
        {
          title: "Perkhidmatan & Kadar",
          content: `
**Perkhidmatan Tersedia:**
• Penghantaran ekspres (1-2 hari)
• Penghantaran standard (3-5 hari)
• Penghantaran hari sama (kawasan bandar)
• Penghantaran ekonomi (5-7 hari)
• Perkhidmatan antarabangsa

**Pengiraan Kadar:**
• Berikan lokasi dari/ke
• Nyatakan berat dalam gram atau kg
• Pilih jenis perkhidmatan jika diketahui

**Contoh:**
• "Berapa kos hantar 1kg dari KL ke Penang?"
• "Kadar untuk penghantaran ekspres ke Johor?"
          `
        },
        {
          title: "Kawalan",
          content: `
**Kawalan Utama:**
• Connect/Disconnect: Kawalan sesi
• Mikrofon: Kawalan input suara
• Tetapan: Pemilihan suara dan model
• Logo CES: Tetapkan semula perbualan

**Bahasa:**
• Butang EN/MS tukar bahasa
• Tetapan kekal merentasi sesi
          `
        },
        {
          title: "Penyelesaian Masalah",
          content: `
**Masalah Sambungan:**
• Semak sambungan internet
• Sahkan kunci API dikonfigurasi
• Segar semula halaman jika perlu

**Masalah Audio:**
• Benarkan kebenaran mikrofon
• Semak tetapan peranti audio
• Cuba pelayar berbeza

**Masalah Kadar:**
• Berikan butiran lokasi lengkap
• Sertakan berat bungkusan
• Gunakan nama lokasi standard
          `
        }
      ]
    }
  };

  const content = manualContent[language as keyof typeof manualContent] || manualContent.en;

  return (
    <div className="manual-container">
      <div className="manual-header">
        <h1 className="manual-title">{content.title}</h1>
        <p className="manual-subtitle">{content.subtitle}</p>
      </div>

      <div className="manual-content">
        {content.sections.map((section, index) => (
          <div key={index} className="manual-section">
            <h2 className="section-title">{section.title}</h2>
            <div className="section-content">
              {section.content.split('\n').map((paragraph, pIndex) => {
                const trimmed = paragraph.trim();
                if (!trimmed) return null;

                if (trimmed.startsWith('**') && trimmed.includes(':**')) {
                  // Handle bold headers with colon
                  const headerText = trimmed.replace(/\*\*/g, '');
                  return (
                    <h3 key={pIndex} className="subsection-title">
                      {headerText}
                    </h3>
                  );
                } else if (trimmed.startsWith('• ')) {
                  // Handle bullet points
                  return (
                    <div key={pIndex} className="bullet-item">
                      {trimmed.substring(2)}
                    </div>
                  );
                } else {
                  // Regular paragraph
                  return (
                    <p key={pIndex} className="manual-paragraph">
                      {trimmed}
                    </p>
                  );
                }
              })}
            </div>
          </div>
        ))}
      </div>

      <div className="manual-footer">
        <p className="footer-text">
          {language === 'en'
            ? "For additional support, please contact the system administrator."
            : "Untuk sokongan tambahan, sila hubungi pentadbir sistem."
          }
        </p>
      </div>
    </div>
  );
};

export default Manual;
