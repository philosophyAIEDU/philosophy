import React, { useState } from 'react';
import { Key, CheckCircle, AlertCircle, ExternalLink, Loader2 } from 'lucide-react';
import { useApp } from '../../contexts/AppContext';

const ApiKeySetup: React.FC = () => {
  const { initializeApiKey } = useApp();
  const [inputKey, setInputKey] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');

  const validateApiKey = async (key: string): Promise<boolean> => {
    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models?key=${key}`
      );
      return response.ok;
    } catch {
      return false;
    }
  };

  const handleTestConnection = async () => {
    if (!inputKey.trim()) {
      setStatus('error');
      setMessage('API 키를 입력해주세요.');
      return;
    }

    setIsLoading(true);
    setStatus('idle');
    setMessage('');

    const isValid = await validateApiKey(inputKey.trim());

    setIsLoading(false);

    if (isValid) {
      setStatus('success');
      setMessage('연결 성공! Premium Learning에 오신 것을 환영합니다.');
      await initializeApiKey(inputKey.trim());
    } else {
      setStatus('error');
      setMessage('연결 실패. API 키를 확인해주세요.');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !isLoading) {
      handleTestConnection();
    }
  };

  return (
    <div className="min-h-screen bg-primary-950 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background Decorative Elements */}
      <div className="absolute inset-0 bg-gradient-luxury opacity-90" />
      <div className="absolute top-0 left-0 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-5 pointer-events-none" />
      <div className="absolute -top-24 -right-24 w-96 h-96 bg-accent-gold/20 rounded-full blur-3xl" />
      <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-primary-500/20 rounded-full blur-3xl" />

      <div className="relative z-10 w-full max-w-lg">
        <div className="luxury-card rounded-2xl p-8 md:p-12 shadow-2xl backdrop-blur-xl border border-white/10">
          <div className="text-center mb-10">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-gold rounded-2xl mb-6 shadow-lg shadow-accent-gold/20 transform rotate-3">
              <Key className="w-10 h-10 text-primary-950" />
            </div>
            <h1 className="text-4xl font-serif font-bold text-primary-50 mb-3 tracking-tight">
              Amobe English
            </h1>
            <p className="text-accent-gold font-medium tracking-widest text-sm uppercase mb-4">
              프리미엄 AI 학습
            </p>
            <p className="text-primary-300 font-light text-lg">
              Gemini API 키를 입력하여 학습을 시작하세요.
            </p>
          </div>

          <div className="space-y-8">
            <div>
              <label
                htmlFor="apiKey"
                className="block text-sm font-medium text-primary-200 mb-2 ml-1"
              >
                Gemini API Key
              </label>
              <div className="relative">
                <input
                  id="apiKey"
                  type="password"
                  value={inputKey}
                  onChange={(e) => setInputKey(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="AIza..."
                  className="w-full px-6 py-4 bg-primary-900/50 border border-primary-700 rounded-xl focus:ring-2 focus:ring-accent-gold focus:border-transparent text-primary-50 placeholder-primary-600 transition-all outline-none"
                  disabled={isLoading}
                />
              </div>
            </div>

            <button
              onClick={handleTestConnection}
              disabled={isLoading || !inputKey.trim()}
              className="w-full py-4 px-6 bg-gradient-gold text-primary-950 font-bold text-lg rounded-xl hover:shadow-lg hover:shadow-accent-gold/30 focus:outline-none focus:ring-2 focus:ring-accent-gold focus:ring-offset-2 focus:ring-offset-primary-900 disabled:opacity-50 disabled:cursor-not-allowed transition-all transform hover:-translate-y-0.5 active:translate-y-0 flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-6 h-6 animate-spin" />
                  확인 중...
                </>
              ) : (
                '학습 시작하기'
              )}
            </button>

            {status !== 'idle' && (
              <div
                className={`flex items-center gap-3 p-4 rounded-xl border ${status === 'success'
                    ? 'bg-green-900/20 border-green-800 text-green-400'
                    : 'bg-red-900/20 border-red-800 text-red-400'
                  } animate-fade-in`}
              >
                {status === 'success' ? (
                  <CheckCircle className="w-5 h-5 flex-shrink-0" />
                ) : (
                  <AlertCircle className="w-5 h-5 flex-shrink-0" />
                )}
                <span className="text-sm font-medium">{message}</span>
              </div>
            )}

            <div className="border-t border-primary-800 pt-8 space-y-4">
              <a
                href="https://aistudio.google.com/app/apikey"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 text-primary-400 hover:text-accent-gold transition-colors text-sm group"
              >
                <ExternalLink className="w-4 h-4 group-hover:scale-110 transition-transform" />
                Google AI Studio에서 API 키 발급받기
              </a>

              <div className="bg-primary-900/30 rounded-xl p-4 border border-primary-800/50">
                <div className="flex items-start gap-3">
                  <Key className="w-4 h-4 text-primary-500 mt-1 flex-shrink-0" />
                  <p className="text-xs text-primary-400 leading-relaxed">
                    API 키는 브라우저의 로컬 스토리지에 안전하게 저장되며, 서버로 전송되지 않습니다.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ApiKeySetup;
