import React, { useState, useRef, useEffect } from 'react';
import { useNetwork } from '../context/NetworkContext';
import { apiClient } from '../services/apiClient';
import {
  Sparkles,
  Send,
  CheckCircle2,
  AlertTriangle,
  Radio,
  FileText,
  Activity,
  Bot,
  User,
  ShieldCheck,
  HelpCircle,
  Clock,
  ListFilter,
  ArrowRight,
} from 'lucide-react';

export function CopilotPage({ onOpenIncident }) {
  const { towers, incidents } = useNetwork();
  const [messages, setMessages] = useState([
    {
      id: 'msg-welcome',
      role: 'assistant',
      text: 'Welcome to TowerMind AI Copilot. I am your specialized telecom operations assistant grounded in live telemetry from 20 cell sites across Dhaka Metropolitan NOC. How can I assist your network investigation today?',
      facts: [
        { statement: 'Operating on allowlisted telemetry stream (ORG-001).' },
        { statement: 'Gemini 1.5 Pro reasoning engine active.' },
      ],
      dataUsed: ['telemetryRegistry', 'incidentStore'],
      steps: [
        'Query active degraded cell sites across Dhaka',
        'Analyze backhaul latency patterns on DHK-104',
        'Review recommended checklist for active incidents',
      ],
      time: '10:00 AM',
    },
  ]);
  const [inputPrompt, setInputPrompt] = useState('');
  const [isThinking, setIsThinking] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isThinking]);

  const handleSendMessage = async (textToSend) => {
    const query = textToSend || inputPrompt;
    if (!query.trim() || isThinking) return;

    const userMessage = {
      id: `usr-${Date.now()}`,
      role: 'user',
      text: query,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages(prev => [...prev, userMessage]);
    setInputPrompt('');
    setIsThinking(true);

    try {
      const response = await apiClient.askCopilot(query, { towers, incidents });
      const botMessage = {
        id: `bot-${Date.now()}`,
        role: 'assistant',
        text: response.answer,
        facts: response.observedFacts || [],
        dataUsed: response.dataUsed || [],
        hypotheses: response.hypotheses || [],
        steps: response.recommendedSteps || [],
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages(prev => [...prev, botMessage]);
    } catch (err) {
      setMessages(prev => [
        ...prev,
        {
          id: `bot-err-${Date.now()}`,
          role: 'assistant',
          text: `Unable to complete query: ${err.message}. Please retry or ask about allowlisted telemetry.`,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } finally {
      setIsThinking(false);
    }
  };

  const samplePrompts = [
    'Which towers are currently degraded or critical?',
    'Show me details and latency for DHK-104',
    'Summarize active incidents in this session',
    'What checks are recommended for high packet loss?',
  ];

  return (
    <div className="h-[calc(100vh-140px)] flex flex-col space-y-4">
      {/* Copilot Header */}
      <div className="bg-white rounded-2xl p-4 sm:p-5 border border-[#EAE8F5] shadow-subtle flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-brand-gradient text-white flex items-center justify-center shadow-md shadow-[#496DF5]/20">
            <Sparkles size={20} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-manrope text-base font-bold text-[#171B3D]">
                TowerMind AI Copilot
              </h2>
              <span className="px-2 py-0.5 rounded-full bg-[#EDE9FF] text-[#6546E8] text-[10px] font-bold font-mono">
                GROUNDED REASONING
              </span>
            </div>
            <p className="text-xs text-[#68708D]">
              Evidence-based query assistant evaluating verified telemetry fields only.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto text-xs">
          <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-[#F8F8FF] border border-[#EAE8F5] text-[#171B3D]">
            <ShieldCheck size={13} className="text-[#20B486]" />
            Allowlist Enforced
          </span>
          <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-[#F8F8FF] border border-[#EAE8F5] text-[#171B3D]">
            <Radio size={13} className="text-[#6546E8]" />
            20 Sites Synced
          </span>
        </div>
      </div>

      {/* Chat Messages Workspace */}
      <div className="flex-1 bg-white rounded-2xl border border-[#EAE8F5] shadow-subtle p-4 sm:p-6 overflow-y-auto space-y-5">
        {messages.map(msg => {
          const isUser = msg.role === 'user';

          return (
            <div
              key={msg.id}
              className={`flex gap-3 max-w-3xl ${isUser ? 'ml-auto flex-row-reverse' : ''}`}
            >
              {/* Avatar */}
              <div
                className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 font-bold text-xs ${
                  isUser
                    ? 'bg-[#111B49] text-white'
                    : 'bg-brand-gradient text-white shadow-xs'
                }`}
              >
                {isUser ? <User size={15} /> : <Sparkles size={15} />}
              </div>

              {/* Message Bubble */}
              <div className="space-y-3 flex-1 min-w-0">
                <div
                  className={`p-4 rounded-2xl text-xs sm:text-[13px] leading-relaxed ${
                    isUser
                      ? 'bg-brand-gradient text-white rounded-tr-none shadow-sm'
                      : 'bg-[#F9F8FF] border border-[#EAE8F5] text-[#171B3D] rounded-tl-none'
                  }`}
                >
                  <p>{msg.text}</p>
                </div>

                {/* Structured Assistant Cards */}
                {!isUser && msg.facts && msg.facts.length > 0 && (
                  <div className="p-3.5 bg-white rounded-xl border border-[#ECEAF5] space-y-2 text-xs">
                    <span className="font-manrope text-[11px] font-bold text-[#68708D] uppercase tracking-wider block">
                      Ground Truth Facts (Allowlisted Data):
                    </span>
                    <ul className="space-y-1.5">
                      {msg.facts.map((f, idx) => (
                        <li key={idx} className="flex items-start gap-2 text-[#171B3D]">
                          <CheckCircle2 size={13} className="text-[#20B486] shrink-0 mt-0.5" />
                          <span className="text-[11px] leading-snug">{f.statement}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {!isUser && msg.hypotheses && msg.hypotheses.length > 0 && (
                  <div className="p-3.5 bg-[#FFFBF5] rounded-xl border border-[#FBD9A4] text-xs">
                    <span className="font-manrope text-[11px] font-bold text-[#F3A43B] uppercase tracking-wider block mb-1">
                      Evaluated Hypotheses (Uncertainty Flagged):
                    </span>
                    <ul className="space-y-1 text-[#171B3D]">
                      {msg.hypotheses.map((h, i) => (
                        <li key={i} className="text-[11px]">• {h}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {!isUser && msg.steps && msg.steps.length > 0 && (
                  <div className="p-3 bg-[#F8F8FF] rounded-xl border border-[#ECEAF5] text-xs">
                    <span className="font-manrope text-[11px] font-bold text-[#6546E8] uppercase tracking-wider block mb-1.5">
                      Recommended Human Verification Actions:
                    </span>
                    <div className="space-y-1">
                      {msg.steps.map((st, i) => (
                        <div key={i} className="flex items-center gap-1.5 text-[11px] text-[#171B3D]">
                          <ArrowRight size={11} className="text-[#6546E8] shrink-0" />
                          <span>{st}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <span className="text-[10px] text-[#9299AF] block px-1">
                  {msg.time}
                </span>
              </div>
            </div>
          );
        })}

        {isThinking && (
          <div className="flex gap-3 max-w-xl">
            <div className="w-8 h-8 rounded-xl bg-brand-gradient text-white flex items-center justify-center shrink-0">
              <Sparkles size={15} />
            </div>
            <div className="p-4 rounded-2xl bg-[#F9F8FF] border border-[#EAE8F5] rounded-tl-none flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#6546E8] animate-bounce"></span>
              <span className="w-2 h-2 rounded-full bg-[#6546E8] animate-bounce [animation-delay:0.2s]"></span>
              <span className="w-2 h-2 rounded-full bg-[#6546E8] animate-bounce [animation-delay:0.4s]"></span>
              <span className="text-xs text-[#68708D] font-medium ml-2">TowerMind is parsing telemetry bounds...</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Quick Suggested Prompts */}
      <div className="flex items-center gap-2 overflow-x-auto py-1 shrink-0">
        <span className="text-xs font-semibold text-[#68708D] whitespace-nowrap flex items-center gap-1">
          <HelpCircle size={13} />
          Suggested:
        </span>
        {samplePrompts.map((p, idx) => (
          <button
            key={idx}
            onClick={() => handleSendMessage(p)}
            className="px-3 py-1.5 rounded-xl bg-white border border-[#EAE8F5] text-[11px] font-medium text-[#171B3D] hover:border-[#6546E8] hover:bg-[#F5F4FF] transition-all whitespace-nowrap shadow-2xs"
          >
            {p}
          </button>
        ))}
      </div>

      {/* Input Field */}
      <div className="bg-white rounded-2xl p-2.5 sm:p-3 border border-[#EAE8F5] shadow-subtle shrink-0">
        <form
          onSubmit={e => {
            e.preventDefault();
            handleSendMessage();
          }}
          className="flex items-center gap-2"
        >
          <input
            type="text"
            placeholder="Ask TowerMind about towers, incidents, latency correlations, or checks..."
            value={inputPrompt}
            onChange={e => setInputPrompt(e.target.value)}
            disabled={isThinking}
            className="flex-1 px-3 py-2 bg-[#F5F5FC] border border-[#E5E3F0] rounded-xl text-xs text-[#171B3D] placeholder-[#9299AF] focus:outline-none focus:border-[#6546E8] focus:bg-white transition-all"
          />
          <button
            type="submit"
            disabled={!inputPrompt.trim() || isThinking}
            className={`p-2.5 rounded-xl text-white flex items-center justify-center transition-all ${
              !inputPrompt.trim() || isThinking
                ? 'bg-[#EAE8F5] text-[#9299AF] cursor-not-allowed'
                : 'bg-brand-gradient hover:opacity-95 shadow-sm shadow-[#496DF5]/20'
            }`}
          >
            <Send size={15} />
          </button>
        </form>
      </div>
    </div>
  );
}

