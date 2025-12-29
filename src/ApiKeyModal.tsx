import React, { useState } from 'react';
import { Key, AlertCircle, CheckCircle, ExternalLink, X, Eye, EyeOff } from 'lucide-react';

interface ApiKeyModalProps {
  isOpen: boolean;
  onClose: () => void;
  username: string;
  currentHasCustomKey: boolean;
  onSaveSuccess: () => void;
}

const ApiKeyModal: React.FC<ApiKeyModalProps> = ({
  isOpen,
  onClose,
  username,
  currentHasCustomKey,
  onSaveSuccess
}) => {
  const [apiKey, setApiKey] = useState<string>('');
  const [showKey, setShowKey] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);
  const [message, setMessage] = useState<string>('');
  const [messageType, setMessageType] = useState<'success' | 'error' | ''>('');

  if (!isOpen) return null;

  const handleSave = async () => {
    if (!apiKey.trim()) {
      setMessage('Wprowadź klucz API');
      setMessageType('error');
      return;
    }

    // Walidacja formatu Gemini
    if (!apiKey.startsWith('AIzaSy')) {
      setMessage('Klucz Gemini API powinien zaczynać się od "AIzaSy"');
      setMessageType('error');
      return;
    }

    setIsSaving(true);
    setMessage('Zapisywanie klucza...');
    setMessageType('');

    try {
      const apiEndpoint = process.env.NODE_ENV === 'development'
        ? 'http://localhost:7071/api/updateApiKey'
        : 'https://kartkowkafunc-etaeawfubqcefcah.westeurope-01.azurewebsites.net/api/updateApiKey';

      const response = await fetch(apiEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-functions-key': process.env.REACT_APP_FUNCTION_KEY as string,
        },
        body: JSON.stringify({
          username,
          action: 'set',
          apiKey: apiKey.trim(),
          provider: 'gemini',
          model: 'gemini-2.0-flash'
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setMessage('✅ Klucz API zapisany pomyślnie! Możesz teraz generować nieograniczoną liczbę zapytań.');
        setMessageType('success');
        setApiKey('');
        setTimeout(() => {
          onSaveSuccess();
          onClose();
        }, 2000);
      } else {
        setMessage(data.error || 'Nie udało się zapisać klucza');
        setMessageType('error');
      }
    } catch (error) {
      setMessage(`Błąd sieci: ${error}`);
      setMessageType('error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Czy na pewno chcesz usunąć swój klucz API? Wrócisz do limitu 5 zapytań/dzień.')) {
      return;
    }

    setIsDeleting(true);
    setMessage('Usuwanie klucza...');
    setMessageType('');

    try {
      const apiEndpoint = process.env.NODE_ENV === 'development'
        ? 'http://localhost:7071/api/updateApiKey'
        : 'https://kartkowkafunc-etaeawfubqcefcah.westeurope-01.azurewebsites.net/api/updateApiKey';

      const response = await fetch(apiEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-functions-key': process.env.REACT_APP_FUNCTION_KEY as string,
        },
        body: JSON.stringify({
          username,
          action: 'delete'
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setMessage('✅ Klucz API usunięty. Używasz teraz domyślnego klucza (5 zapytań/dzień).');
        setMessageType('success');
        setTimeout(() => {
          onSaveSuccess();
          onClose();
        }, 2000);
      } else {
        setMessage(data.error || 'Nie udało się usunąć klucza');
        setMessageType('error');
      }
    } catch (error) {
      setMessage(`Błąd sieci: ${error}`);
      setMessageType('error');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white p-6 rounded-lg shadow-xl max-w-2xl w-full relative max-h-[90vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-gray-500 hover:text-gray-700 text-2xl font-bold"
          aria-label="Zamknij"
          disabled={isSaving || isDeleting}
        >
          <X size={24} />
        </button>

        <div className="flex items-center mb-4">
          <Key size={28} className="text-blue-600 mr-3" />
          <h2 className="text-2xl font-bold text-gray-800">Klucz API do Twojego AI</h2>
        </div>

        {/* Info Box */}
        <div className="bg-blue-50 border-l-4 border-blue-500 p-4 mb-6 rounded">
          <div className="flex items-start">
            <AlertCircle size={20} className="text-blue-600 mt-0.5 mr-2 flex-shrink-0" />
            <div className="text-sm text-blue-800">
              <p className="font-semibold mb-1">Dlaczego potrzebujesz własnego klucza?</p>
              <p>Domyślnie masz <strong>5 bezpłatnych zapytań dziennie</strong>. Dodając własny klucz API, otrzymujesz <strong>nieograniczony dostęp</strong>.</p>
            </div>
          </div>
        </div>

        {/* Instrukcja */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-3">📝 Jak założyć klucz API (Gemini):</h3>
          
          <ol className="space-y-3 text-sm text-gray-700">
            <li className="flex items-start">
              <span className="font-bold text-blue-600 mr-2">1.</span>
              <div>
                Przejdź na stronę{' '}
                <a
                  href="https://aistudio.google.com/app/apikey"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:text-blue-800 underline inline-flex items-center"
                >
                  Google AI Studio <ExternalLink size={14} className="ml-1" />
                </a>
              </div>
            </li>
            <li className="flex items-start">
              <span className="font-bold text-blue-600 mr-2">2.</span>
              <span>Zaloguj się kontem Google</span>
            </li>
            <li className="flex items-start">
              <span className="font-bold text-blue-600 mr-2">3.</span>
              <span>Kliknij <strong>"Create API key"</strong></span>
            </li>
            <li className="flex items-start">
              <span className="font-bold text-blue-600 mr-2">4.</span>
              <span>Wybierz projekt (lub utwórz nowy)</span>
            </li>
            <li className="flex items-start">
              <span className="font-bold text-blue-600 mr-2">5.</span>
              <span>Skopiuj wygenerowany klucz (zaczyna się od <code className="bg-gray-100 px-1 rounded">AIzaSy...</code>)</span>
            </li>
            <li className="flex items-start">
              <span className="font-bold text-blue-600 mr-2">6.</span>
              <span>Wklej klucz poniżej i kliknij "Zapisz"</span>
            </li>
          </ol>
        </div>

        {/* Status */}
        {currentHasCustomKey && (
          <div className="bg-green-50 border-l-4 border-green-500 p-3 mb-4 rounded">
            <div className="flex items-center">
              <CheckCircle size={18} className="text-green-600 mr-2" />
              <p className="text-sm text-green-800 font-medium">
                ✓ Masz już zapisany własny klucz API (nieograniczone zapytania)
              </p>
            </div>
          </div>
        )}

        {/* Input */}
        <div className="mb-6">
          <label className="block text-gray-700 text-sm font-bold mb-2">
            Twój klucz Gemini API:
          </label>
          <div className="relative">
            <input
              type={showKey ? 'text' : 'password'}
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="AIzaSy..."
              className="w-full p-3 pr-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm"
              disabled={isSaving || isDeleting}
            />
            <button
              type="button"
              onClick={() => setShowKey(!showKey)}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
            >
              {showKey ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Klucz jest szyfrowany (AES-256) i bezpiecznie przechowywany w bazie danych
          </p>
        </div>

        {/* Message */}
        {message && (
          <div className={`p-3 rounded mb-4 ${
            messageType === 'success' ? 'bg-green-100 text-green-800' :
            messageType === 'error' ? 'bg-red-100 text-red-800' :
            'bg-blue-100 text-blue-800'
          }`}>
            <p className="text-sm">{message}</p>
          </div>
        )}

        {/* Buttons */}
        <div className="flex justify-between items-center">
          <div>
            {currentHasCustomKey && (
              <button
                onClick={handleDelete}
                className="bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-4 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={isSaving || isDeleting}
              >
                {isDeleting ? 'Usuwanie...' : 'Usuń klucz'}
              </button>
            )}
          </div>
          
          <div className="flex space-x-3">
            <button
              onClick={onClose}
              className="bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-2 px-4 rounded-lg transition disabled:opacity-50"
              disabled={isSaving || isDeleting}
            >
              Anuluj
            </button>
            <button
              onClick={handleSave}
              className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={isSaving || isDeleting || !apiKey.trim()}
            >
              {isSaving ? 'Zapisywanie...' : currentHasCustomKey ? 'Zaktualizuj' : 'Zapisz'}
            </button>
          </div>
        </div>

        {/* Footer Note */}
        <div className="mt-6 pt-4 border-t border-gray-200">
          <p className="text-xs text-gray-600 text-center">
            💡 <strong>Wskazówka:</strong> Gemini API jest darmowe do 1500 zapytań/dzień.
            {' '}
            <a
              href="https://ai.google.dev/pricing"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:text-blue-800 underline"
            >
              Zobacz cennik
            </a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default ApiKeyModal;