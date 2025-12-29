import React, { useState, useEffect } from 'react';
import { useMsal } from '@azure/msal-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Loader, FileText, Calendar, TrendingUp, Filter, X, AlertCircle } from 'lucide-react';

// ============================================
// INTERFACES
// ============================================

interface MaterialUsedInSession {
  materialId: string;
  conceptId?: string;
  conceptName?: string;
  curriculumTopicId?: string;
  curriculumId?: string;
  contentType?: string;
  topic?: string;
  partition_key_m?: string;
}

// 🆕 DODANE - interface dla focusArea
interface FocusArea {
  conceptId?: string;
  conceptName?: string;
  currentAccuracy?: number;
  suggestedDifficulty?: string;
  priority?: string;
}

interface SavedSession {
  id: string;
  subject: string;
  topic: string;
  createdAt: string;
  lastModifiedAt: string;
  performance?: {
    overallScore?: number;
  };
  recommendations?: {
    focusAreas?: (string | FocusArea)[];  // 🆕 Może być string LUB obiekt
  };
  sessionType?: string;
  primaryConcepts?: string[];
  studentContext?: {
    className?: string;
  };
  materials?: {
    materialsUsedInSession?: MaterialUsedInSession[];
  };
  tests?: {
    questions?: Array<{
      conceptId?: string;
      conceptName?: string;
    }>;
  };
}

interface CurriculumFilter {
  filterBy: 'curriculum';
  class: string;
  subject: string;
  topicName: string;
  topicId: string;
  conceptIds: string[];
}

const YourTestsPage: React.FC = () => {
  const { accounts } = useMsal();
  const location = useLocation();
  const navigate = useNavigate();
  const isAuthenticated = accounts.length > 0;
  const username = accounts[0]?.username || '';

  const [sessions, setSessions] = useState<SavedSession[]>([]);
  const [filteredSessions, setFilteredSessions] = useState<SavedSession[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');

  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedSubject, setSelectedSubject] = useState<string>('');
  const [selectedTopic, setSelectedTopic] = useState<string>('');
  const [sortBy, setSortBy] = useState<'date' | 'score'>('date');

  const [curriculumFilter, setCurriculumFilter] = useState<CurriculumFilter | null>(null);

  useEffect(() => {
    const state = location.state as CurriculumFilter | undefined;
    
    if (state && state.filterBy === 'curriculum') {
      console.log('🔍 [YourTests] Otrzymano filtr curriculum:', state);
      setCurriculumFilter(state);
      setSelectedSubject(state.subject);
    }
  }, [location.state]);

  useEffect(() => {
    const fetchSessions = async () => {
      if (!isAuthenticated || !username) return;

      setLoading(true);
      setError('');

      try {
        const functionKey = process.env.REACT_APP_FUNCTION_KEY || '';
        
        let apiEndpoint = process.env.NODE_ENV === 'development'
          ? `http://localhost:7071/api/getUserSessions?username=${encodeURIComponent(username)}`
          : `https://kartkowkafunc-etaeawfubqcefcah.westeurope-01.azurewebsites.net/api/getUserSessions?username=${encodeURIComponent(username)}`;
        
        if (curriculumFilter?.topicId) {
          apiEndpoint += `&curriculumTopicId=${encodeURIComponent(curriculumFilter.topicId)}`;
          console.log('🔍 [YourTests] Filtrowanie po curriculumTopicId:', curriculumFilter.topicId);
        }

        const response = await fetch(apiEndpoint, {
          method: 'GET',
          headers: functionKey ? { 'x-functions-key': functionKey } : {},
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data: SavedSession[] = await response.json();
        console.log('✅ [YourTests] Pobrano sesje:', data.length);
        setSessions(data);
      } catch (err: any) {
        console.error('❌ [YourTests] Błąd pobierania sesji:', err);
        setError(err.message || 'Błąd podczas ładowania sesji');
      } finally {
        setLoading(false);
      }
    };

    fetchSessions();
  }, [isAuthenticated, username, curriculumFilter]);

  const filterAndSortSessions = () => {
    let filtered = [...sessions];

    if (!curriculumFilter && selectedSubject) {
      filtered = filtered.filter((s) => s.subject === selectedSubject);
    }

    if (selectedTopic) {
      filtered = filtered.filter((s) => s.topic === selectedTopic);
    }

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (s) =>
          s.topic.toLowerCase().includes(query) ||
          s.subject.toLowerCase().includes(query)
      );
    }

    filtered.sort((a, b) => {
      if (sortBy === 'date') {
        return new Date(b.lastModifiedAt).getTime() - new Date(a.lastModifiedAt).getTime();
      } else {
        const scoreA = a.performance?.overallScore || 0;
        const scoreB = b.performance?.overallScore || 0;
        return scoreB - scoreA;
      }
    });

    return filtered;
  };

  useEffect(() => {
    setFilteredSessions(filterAndSortSessions());
  }, [sessions, searchQuery, selectedSubject, selectedTopic, sortBy, curriculumFilter]);

  const handleClearCurriculumFilter = () => {
    setCurriculumFilter(null);
    setSelectedSubject('');
    navigate('/twoje-kartkowki', { replace: true, state: null });
  };

  const handleLoadSession = async (sessionId: string) => {
    console.log('🚀 [YourTests] Ładowanie sesji:', sessionId);

    try {
      const functionKey = process.env.REACT_APP_FUNCTION_KEY || '';
      const apiEndpoint =
        process.env.NODE_ENV === 'development'
          ? `http://localhost:7071/api/getSessionById?sessionId=${encodeURIComponent(sessionId)}`
          : `https://kartkowkafunc-etaeawfubqcefcah.westeurope-01.azurewebsites.net/api/getSessionById?sessionId=${encodeURIComponent(sessionId)}`;

      const response = await fetch(apiEndpoint, {
        method: 'GET',
        headers: functionKey ? { 'x-functions-key': functionKey } : {},
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const sessionData = await response.json();
      console.log('📦 [YourTests] Pobrano dane sesji:', sessionData);

      localStorage.setItem('loadedSession', JSON.stringify(sessionData));
      localStorage.setItem('shouldLoadSession', 'true');

      console.log('💾 [YourTests] Zapisano sesję w localStorage');
      navigate('/');
    } catch (err: any) {
      console.error('❌ [YourTests] Błąd ładowania sesji:', err);
      alert(`Nie udało się załadować sesji: ${err.message}`);
    }
  };

  // 🆕 HELPER do wyświetlania focusArea (kompatybilny z string i object)
  const renderFocusArea = (area: string | FocusArea): string => {
    if (typeof area === 'string') {
      return area;  // Stary format (string)
    }
    return area.conceptName || 'Unknown';  // Nowy format (obiekt)
  };

  const uniqueSubjects = Array.from(new Set(sessions.map((s) => s.subject))).sort();
  const uniqueTopics = Array.from(new Set(sessions.map((s) => s.topic))).sort();

  if (!isAuthenticated) {
    return (
      <div className="text-center mt-10 text-gray-600">
        Zaloguj się, aby zobaczyć zapisane kartkówki.
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto mt-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">Twoje Zapisane Kartkówki</h1>
        <p className="text-gray-600">Przeglądaj i wczytaj swoje wcześniejsze sesje nauki.</p>
      </div>

      {curriculumFilter && (
        <div className="bg-blue-50 border-l-4 border-blue-500 p-4 mb-4 rounded-lg">
          <div className="flex items-start justify-between">
            <div className="flex items-start">
              <AlertCircle size={20} className="text-blue-600 mt-0.5 mr-2 flex-shrink-0" />
              <div>
                <p className="font-bold text-sm text-blue-800">
                  Filtrowanie według podstawy programowej
                </p>
                <p className="text-xs text-blue-700 mt-1">
                  Przedmiot: <strong>{curriculumFilter.subject}</strong> | 
                  Temat: <strong>{curriculumFilter.topicName}</strong> | 
                  Klasa: <strong>{curriculumFilter.class}</strong>
                </p>
                <p className="text-xs text-blue-600 mt-1">
                  Znaleziono: <strong>{filteredSessions.length}</strong> {filteredSessions.length === 1 ? 'kartkówkę' : 'kartkówek'}
                </p>
              </div>
            </div>
            <button
              onClick={handleClearCurriculumFilter}
              className="ml-4 text-blue-600 hover:text-blue-800 flex items-center text-sm"
            >
              <X size={16} className="mr-1" />
              Wyczyść
            </button>
          </div>
        </div>
      )}

      {!curriculumFilter && (
        <div className="bg-white rounded-xl shadow-lg p-4 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-800 flex items-center">
              <Filter size={20} className="mr-2" />
              Filtrowanie i Sortowanie
            </h2>
            {(searchQuery || selectedSubject || selectedTopic) && (
              <button
                onClick={() => {
                  setSearchQuery('');
                  setSelectedSubject('');
                  setSelectedTopic('');
                }}
                className="text-sm text-red-600 hover:text-red-800 flex items-center"
              >
                <X size={16} className="mr-1" />
                Wyczyść filtry
            </button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Szukaj</label>
              <input
                type="text"
                placeholder="Szukaj w tematach..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500 text-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Przedmiot</label>
              <select
                value={selectedSubject}
                onChange={(e) => setSelectedSubject(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500 text-sm"
              >
                <option value="">Wszystkie przedmioty</option>
                {uniqueSubjects.map((subject) => (
                  <option key={subject} value={subject}>
                    {subject}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Temat</label>
              <select
                value={selectedTopic}
                onChange={(e) => setSelectedTopic(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500 text-sm"
              >
                <option value="">Wszystkie tematy</option>
                {uniqueTopics.map((topic) => (
                  <option key={topic} value={topic}>
                    {topic}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Sortuj według</label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as 'date' | 'score')}
                className="w-full p-2 border border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500 text-sm"
              >
                <option value="date">Data (najnowsze)</option>
                <option value="score">Wynik (najlepsze)</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {loading && (
        <div className="bg-white rounded-xl shadow-lg p-6 flex items-center justify-center">
          <Loader className="animate-spin mr-2 text-blue-500" size={24} />
          <span className="text-gray-700">Ładowanie sesji...</span>
        </div>
      )}

      {error && (
        <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-lg mb-4">
          <p className="text-red-700 font-medium">Błąd: {error}</p>
        </div>
      )}

      {!loading && !error && (
        <>
          {filteredSessions.length === 0 ? (
            <div className="bg-white rounded-xl shadow-lg p-6 text-center text-gray-500">
              {curriculumFilter
                ? 'Nie znaleziono kartkówek pasujących do wybranego tematu.'
                : 'Nie masz jeszcze zapisanych kartkówek.'}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredSessions.map((session) => (
                <div
                  key={session.id}
                  className="bg-white rounded-xl shadow-lg p-4 hover:shadow-xl transition cursor-pointer border border-gray-200"
                  onClick={() => handleLoadSession(session.id)}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <h3 className="text-lg font-bold text-gray-800 mb-1">
                        {session.topic || 'Bez nazwy'}
                      </h3>
                      <p className="text-sm text-gray-600">
                        {session.subject}
                      </p>
                    </div>
                    {session.performance?.overallScore !== undefined && (
                      <div className="ml-2 flex items-center bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-semibold">
                        <TrendingUp size={14} className="mr-1" />
                        {session.performance.overallScore}%
                      </div>
                    )}
                  </div>

                  <div className="flex items-center text-xs text-gray-500 mb-2">
                    <Calendar size={14} className="mr-1" />
                    {new Date(session.lastModifiedAt).toLocaleDateString('pl-PL')}
                  </div>

                  {/* 🆕 NAPRAWIONE - wyświetlanie focusAreas */}
                  {session.recommendations?.focusAreas && session.recommendations.focusAreas.length > 0 && (
                    <div className="mt-2">
                      <p className="text-xs text-gray-600 mb-1">Obszary do poprawy:</p>
                      <div className="flex flex-wrap gap-1">
                        {session.recommendations.focusAreas.slice(0, 3).map((area, idx) => (
                          <span
                            key={idx}
                            className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded"
                          >
                            {renderFocusArea(area)}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  <button
                    className="mt-3 w-full bg-blue-500 hover:bg-blue-600 text-white font-medium py-2 px-4 rounded-lg transition flex items-center justify-center"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleLoadSession(session.id);
                    }}
                  >
                    <FileText size={16} className="mr-2" />
                    Wczytaj sesję
                  </button>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default YourTestsPage;