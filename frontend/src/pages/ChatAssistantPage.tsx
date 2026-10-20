import React, { useState, useRef, useEffect } from 'react';
import {
  Send,
  Sparkles,
  User,
  Trash2,
  ExternalLink,
} from 'lucide-react';
import { ChatMessage, Language } from '../types';
import { sendChatMessage } from '../services/api';

interface ChatAssistantPageProps {
  language: Language;
  onLanguageChange: (lang: Language) => void;
}

const currentTimeLabel = () =>
  new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

const createMessageId = (prefix: string) => `${prefix}_${crypto.randomUUID()}`;

export const ChatAssistantPage: React.FC<ChatAssistantPageProps> = ({
  language,
  onLanguageChange,
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    return [
      {
        id: 'welcome',
        role: 'assistant',
        content:
          language === 'te'
            ? 'నమస్కారం! నేను **MediGuide AI** ఆరోగ్య సహాయకుడిని. రక్త పరీక్షల ఫలితాలు, వైద్య నిబంధనలు (CBC, LDL కొలెస్ట్రాల్, బ్లడ్ షుగర్ మొదలైనవి) లేదా సాధారణ ఆరోగ్య సందేహాలను అర్థం చేసుకోవడానికి నన్ను అడగవచ్చు. గమనిక: ఇది కేవలం విద్యా సమాచారం కోసం మాత్రమే.'
            : 'Hello! I am **MediGuide AI**, your educational healthcare companion. You can ask me to explain medical laboratory tests (such as CBC, lipid panel, or fasting glucose), reference ranges, and healthy habits in simple terms. Please remember that I provide educational information and not medical diagnoses.',
        timestamp: currentTimeLabel(),
        mode: 'ai',
        suggested_questions:
          language === 'te'
            ? [
                'రక్తంలో హిమోగ్లోబిన్ తక్కువగా ఉంటే ఏమిటి?',
                'LDL కొలెస్ట్రాల్ మరియు HDL కొలెస్ట్రాల్ తేడా ఏమిటి?',
                'ఫాస్టింగ్ బ్లడ్ షుగర్ సాధారణ పరిమితులు ఏమిటి?',
              ]
            : [
                'What does high LDL cholesterol mean?',
                'Explain Hemoglobin and RBC in simple terms',
                'What is the difference between fasting glucose and HbA1c?',
                'What questions should I ask my doctor about my lipid panel?',
              ],
      },
    ];
  });

  const [inputVal, setInputVal] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  const handleSendMessage = async (textToSend?: string) => {
    const text = (textToSend || inputVal).trim();
    if (!text || loading) return;

    const userMsg: ChatMessage = {
      id: createMessageId('usr'),
      role: 'user',
      content: text,
      timestamp: currentTimeLabel(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputVal('');
    setLoading(true);

    try {
      const historyPayload = messages.slice(-4).map((m) => ({
        role: m.role,
        content: m.content,
      }));

      const response = await sendChatMessage({
        message: text,
        language,
        history: historyPayload,
      });

      const assistantMsg: ChatMessage = {
        id: createMessageId('asst'),
        role: 'assistant',
        content: response.reply,
        timestamp: currentTimeLabel(),
        mode: response.mode,
        suggested_questions: response.suggested_questions,
        sources: response.trusted_sources,
      };

      setMessages((prev) => [...prev, assistantMsg]);
    } catch {
      const errorMsg: ChatMessage = {
        id: createMessageId('err'),
        role: 'assistant',
        content:
          language === 'te'
            ? 'క్షమించండి, ప్రతిస్పందనను పొందడంలో సమస్య ఎదురైంది. దయచేసి మళ్లీ ప్రయత్నించండి.'
            : 'I apologize, an error occurred while connecting to the assistant. Please try asking again.',
        timestamp: currentTimeLabel(),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setLoading(false);
    }
  };

  const handleClearHistory = () => {
    setMessages([
      {
        id: 'reset',
        role: 'assistant',
        content:
          language === 'te'
            ? 'చాట్ చరిత్ర రీసెట్ చేయబడింది. కొత్త ప్రశ్న అడగండి.'
            : 'Conversation history reset. How can I assist your health inquiries today?',
        timestamp: currentTimeLabel(),
        suggested_questions:
          language === 'te'
            ? [
                'రక్తంలో హిమోగ్లోబిన్ తక్కువగా ఉంటే ఏమిటి?',
                'LDL కొలెస్ట్రాల్ గురించి వివరించండి',
              ]
            : [
                'What does high LDL cholesterol mean?',
                'Explain Hemoglobin and RBC in simple terms',
              ],
      },
    ]);
  };

  return (
    <div className="space-y-4 animate-fadeIn flex flex-col h-[calc(100vh-12rem)] min-h-[550px]">
      {/* Top Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-indigo-600" />
            <span>{language === 'te' ? 'AI హెల్త్ అసిస్టెంట్' : 'AI Health Assistant'}</span>
          </h1>
          <p className="text-xs text-slate-500">
            {language === 'te'
              ? 'వైద్య పరీక్షలు మరియు సాధారణ ఆరోగ్య విషయాలపై ద్విభాషా వివరణలు.'
              : 'Ask questions about laboratory terms, general biomarker ranges, and preventive lifestyle.'}
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Language Switch */}
          <div className="bg-slate-100 p-0.5 rounded-lg border border-slate-200 flex items-center">
            <button
              onClick={() => onLanguageChange('en')}
              className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-all ${
                language === 'en' ? 'bg-white text-indigo-700 shadow-xs' : 'text-slate-600'
              }`}
            >
              English
            </button>
            <button
              onClick={() => onLanguageChange('te')}
              className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-all ${
                language === 'te' ? 'bg-white text-indigo-700 shadow-xs' : 'text-slate-600'
              }`}
            >
              తెలుగు
            </button>
          </div>

          {/* Clear Session Chat */}
          <button
            onClick={handleClearHistory}
            className="p-1.5 rounded-lg border border-slate-200 text-slate-500 hover:text-rose-600 hover:bg-rose-50 transition-colors"
            title="Clear Chat History"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Chat Messages Scrollable Box */}
      <div className="flex-1 overflow-y-auto p-4 rounded-3xl bg-slate-50 border border-slate-200/90 space-y-4">
        {messages.map((msg) => {
          const isUser = msg.role === 'user';
          return (
            <div
              key={msg.id}
              className={`flex items-start gap-3 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}
            >
              {/* Avatar Icon */}
              <div
                className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                  isUser
                    ? 'bg-indigo-600 text-white'
                    : 'bg-gradient-to-tr from-violet-600 to-indigo-600 text-white shadow-xs'
                }`}
              >
                {isUser ? <User className="w-4 h-4" /> : <Sparkles className="w-4 h-4" />}
              </div>

              {/* Message Bubble */}
              <div
                className={`max-w-[85%] sm:max-w-[75%] rounded-2xl p-4 space-y-2 shadow-xs ${
                  isUser
                    ? 'bg-indigo-600 text-white rounded-tr-none'
                    : 'bg-white text-slate-800 border border-slate-200/90 rounded-tl-none'
                }`}
              >
                <div className="flex items-center justify-between gap-3 text-[10px] opacity-70 mb-1">
                  <span className="font-semibold">
                    {isUser ? 'You' : 'MediGuide Assistant'}
                  </span>
                  <span>{msg.timestamp}</span>
                </div>

                <div className="text-xs sm:text-sm whitespace-pre-wrap leading-relaxed">
                  {msg.content}
                </div>

                {/* Sources Card if provided */}
                {msg.sources && msg.sources.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-slate-100 space-y-1.5">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                      Trusted Public Health References:
                    </span>
                    <div className="flex flex-wrap gap-2">
                      {msg.sources.map((s, idx) => (
                        <a
                          key={idx}
                          href={s.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-50 hover:bg-indigo-50 border border-slate-200 text-indigo-700 text-[11px] font-medium transition-colors"
                        >
                          <span>{s.title} ({s.organization})</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      ))}
                    </div>
                  </div>
                )}

                {/* Suggested prompt chips inside assistant reply */}
                {msg.suggested_questions && msg.suggested_questions.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-slate-100 space-y-1.5">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                      {language === 'te' ? 'సంబంధిత ప్రశ్నలు:' : 'Explore Further:'}
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {msg.suggested_questions.map((promptText, i) => (
                        <button
                          key={i}
                          onClick={() => handleSendMessage(promptText)}
                          className="text-left text-[11px] px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-indigo-50 hover:text-indigo-700 text-slate-700 font-medium transition-colors"
                        >
                          {promptText}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {/* Typing indicator */}
        {loading && (
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-xl bg-violet-600 text-white flex items-center justify-center shrink-0">
              <Sparkles className="w-4 h-4" />
            </div>
            <div className="bg-white border border-slate-200 rounded-2xl rounded-tl-none p-3.5 shadow-xs flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-indigo-600 animate-bounce" />
              <span className="w-2 h-2 rounded-full bg-violet-600 animate-bounce [animation-delay:0.2s]" />
              <span className="w-2 h-2 rounded-full bg-blue-600 animate-bounce [animation-delay:0.4s]" />
              <span className="text-xs text-slate-400 font-medium ml-1">
                {language === 'te' ? 'ఆలోచిస్తున్నాను...' : 'Formulating safe educational explanation...'}
              </span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Form Bar */}
      <div className="space-y-2">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSendMessage();
          }}
          className="flex items-center gap-2 bg-white p-2 rounded-2xl border border-slate-200 shadow-sm focus-within:border-indigo-400 focus-within:ring-2 focus-within:ring-indigo-100 transition-all"
        >
          <input
            type="text"
            value={inputVal}
            onChange={(e) => setInputVal(e.target.value)}
            placeholder={
              language === 'te'
                ? 'వైద్య నిబంధన లేదా ల్యాబ్ పరీక్ష గురించి ఇక్కడ అడగండి...'
                : 'Ask about a lab parameter, normal ranges, or doctor questions...'
            }
            className="flex-1 px-3 py-2 text-sm bg-transparent border-none focus:outline-none text-slate-900 placeholder:text-slate-400"
            disabled={loading}
          />
          <button
            type="submit"
            disabled={loading || !inputVal.trim()}
            className="p-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 disabled:hover:bg-indigo-600 text-white transition-all shadow-xs shrink-0"
            aria-label="Send message"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>

        <p className="text-[11px] text-center text-slate-400">
          {language === 'te'
            ? 'గమనిక: ఈ సమాధానాలు కేవలం అవగాహన కోసం మాత్రమే. వైద్య నిర్ధారణకు మీ వైద్యుడిని సంప్రదించండి.'
            : 'Educational information only. Does not diagnose or prescribe. Always consult a certified healthcare professional.'}
        </p>
      </div>
    </div>
  );
};
