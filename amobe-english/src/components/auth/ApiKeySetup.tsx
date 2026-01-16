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
      setMessage('연결 성공! API 키가 유효합니다.');
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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-8">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-indigo-100 rounded-full mb-4">
            <Key className="w-8 h-8 text-indigo-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Amobe English
          </h1>
          <p className="text-gray-600">
            AI 영어 학습을 시작하려면 Gemini API 키가 필요합니다.
          </p>
        </div>

        <div className="space-y-6">
          <div>
            <label
              htmlFor="apiKey"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Gemini API 키
            </label>
            <input
              id="apiKey"
              type="password"
              value={inputKey}
              onChange={(e) => setInputKey(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="AIza..."
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
              disabled={isLoading}
            />
          </div>

          <button
            onClick={handleTestConnection}
            disabled={isLoading || !inputKey.trim()}
            className="w-full py-3 px-4 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                연결 확인 중...
              </>
            ) : (
              '테스트 연결'
            )}
          </button>

          {status !== 'idle' && (
            <div
              className={`flex items-center gap-2 p-4 rounded-lg ${
                status === 'success'
                  ? 'bg-green-50 text-green-800'
                  : 'bg-red-50 text-red-800'
              }`}
            >
              {status === 'success' ? (
                <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
              ) : (
                <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
              )}
              <span className="text-sm">{message}</span>
            </div>
          )}

          <div className="border-t border-gray-200 pt-6 space-y-4">
            <a
              href="https://aistudio.google.com/app/apikey"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 text-indigo-600 hover:text-indigo-800 font-medium transition-colors"
            >
              <ExternalLink className="w-4 h-4" />
              Google AI Studio에서 API 키 발급받기
            </a>

            <div className="bg-gray-50 rounded-lg p-4 space-y-3">
              <div className="flex items-start gap-2">
                <Key className="w-4 h-4 text-gray-500 mt-0.5 flex-shrink-0" />
                <p className="text-sm text-gray-600">
                  API 키는 브라우저의 로컬 스토리지에 안전하게 저장됩니다.
                  서버로 전송되지 않습니다.
                </p>
              </div>

              <div className="flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-amber-500 mt-0.5 flex-shrink-0" />
                <p className="text-sm text-amber-700">
                  <strong>보안 주의:</strong> 공용 컴퓨터에서는 사용 후 반드시
                  로그아웃하거나 브라우저 데이터를 삭제해주세요.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ApiKeySetup;
