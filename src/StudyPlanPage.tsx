import React, { useState, useEffect } from 'react';
import { useMsal } from '@azure/msal-react';
import { useNavigate } from 'react-router-dom';
import { Loader, BookOpen, Target, Lightbulb, Filter, X, FileText } from 'lucide-react';
import { useCurriculumData, CurriculumSubject } from './hooks/useCurriculumData';  // ← POPRAWIONE (bez ../)

const StudyPlanPage: React.FC = () => {
  const { accounts } = useMsal();
  const isAuthenticated = accounts.length > 0;
  const navigate = useNavigate();
  const username = accounts[0]?.username || '';
  
  // 🆕 Pobierz klasę ucznia z profilu
  const [studentClass, setStudentClass] = useState<string>('');
  const [loadingProfile, setLoadingProfile] = useState<boolean>(true);
  
  // Hook do pobierania danych curriculum (czeka aż będzie klasa)
  const {
    curriculumData,
    loading,
    error,
    subjects,
    topicsBySubject,
  } = useCurriculumData(studentClass);

  // Stany filtrowania
  const [selectedSubject, setSelectedSubject] = useState<string>('');
  const [selectedTopic, setSelectedTopic] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');
  
  // 🆕 STATE dla accordion (rozwijane topics)
  const [expandedTopics, setExpandedTopics] = useState<Set<string>>(new Set());

  // 🆕 Toggle topic expansion
  const toggleTopic = (topicId: string) => {
    setExpandedTopics(prev => {
      const newSet = new Set(prev);
      if (newSet.has(topicId)) {
        newSet.delete(topicId);
      } else {
        newSet.add(topicId);
      }
      return newSet;
    });
  };

  // 🆕 Pobierz dane ucznia (klasa)
  useEffect(() => {
    const fetchStudentData = async () => {
      if (!isAuthenticated || !username) {
        setLoadingProfile(false);
        return;
      }

      try {
        const functionKey = process.env.REACT_APP_FUNCTION_KEY || '';
        const apiEndpoint = process.env.NODE_ENV === 'development'
          ? `http://localhost:7071/api/getStudentData?username=${encodeURIComponent(username)}`
          : `https://kartkowkafunc-etaeawfubqcefcah.westeurope-01.azurewebsites.net/api/getStudentData?username=${encodeURIComponent(username)}`;

        const response = await fetch(apiEndpoint, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'x-functions-key': functionKey
          }
        });

        if (response.ok) {
          const data = await response.json();
          setStudentClass(data.className || '5'); // Domyślnie "5" jeśli brak
          console.log('✅ [StudyPlan] Pobrano klasę ucznia:', data.className);
        } else if (response.status === 404) {
          console.warn('⚠️ [StudyPlan] Brak danych ucznia, używam klasy domyślnej: 5');
          setStudentClass('5'); // Domyślna klasa
        } else {
          console.error('❌ [StudyPlan] Błąd pobierania danych:', response.status);
          setStudentClass('5');
        }
      } catch (err) {
        console.error('❌ [StudyPlan] Błąd sieci:', err);
        setStudentClass('5');
      } finally {
        setLoadingProfile(false);
      }
    };

    fetchStudentData();
  }, [isAuthenticated, username]);

  // Funkcja czyszczenia filtrów
  const clearFilters = () => {
    setSelectedSubject('');
    setSelectedTopic('');
    setSearchQuery('');
  };

  // Funkcja nawigacji do Zapisanych Kartkówek z filtrowaniem
  const handleShowQuizzesForTopic = (
    subject: string,
    topicName: string,
    topicId: string,
    conceptIds: string[]
  ) => {
    // Przekaż parametry przez URL state
    navigate('/twoje-kartkowki', {
      state: {
        filterBy: 'curriculum',
        class: studentClass,
        subject: subject,
        topicName: topicName,
        topicId: topicId,
        conceptIds: conceptIds
      }
    });
  };

  // Filtrowanie danych
  const getFilteredData = (): CurriculumSubject[] => {
    if (!curriculumData) return [];

    let filtered: CurriculumSubject[] = curriculumData.subjects;

    // Filtruj po przedmiocie
    if (selectedSubject) {
      filtered = filtered.filter((s: CurriculumSubject) => s.subject === selectedSubject);
    }

    // Filtruj po temacie
    if (selectedTopic) {
      filtered = filtered.map((subject: CurriculumSubject) => ({
        ...subject,
        topics: subject.topics.filter(t => t.topicName === selectedTopic)
      })).filter((s: CurriculumSubject) => s.topics.length > 0);
    }

    // Filtruj po wyszukiwanej frazie
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.map((subject: CurriculumSubject) => ({
        ...subject,
        topics: subject.topics.filter(topic =>
          topic.topicName.toLowerCase().includes(query) ||
          topic.conceptNames.some((c: string) => c.toLowerCase().includes(query)) ||
          topic.curriculumObjectives.some((o: string) => o.toLowerCase().includes(query))
        )
      })).filter((s: CurriculumSubject) => s.topics.length > 0);
    }

    // 🆕 KLUCZOWE: Filtruj przedmioty i tematy - pokaż TYLKO jeśli mają co najmniej 1 concept
    filtered = filtered
      .map((subject: CurriculumSubject) => ({
        ...subject,
        topics: subject.topics.filter(topic => topic.concepts && topic.concepts.length > 0)
      }))
      .filter((s: CurriculumSubject) => s.topics.length > 0);

    return filtered;
  };

  const filteredData = getFilteredData();

  // Liczniki dla statystyk
  const totalTopicsFiltered = filteredData.reduce(
    (sum: number, s: CurriculumSubject) => sum + s.topics.length, 
    0
  );
  const totalConceptsFiltered = filteredData.reduce(
    (sum: number, s: CurriculumSubject) => 
      sum + s.topics.reduce((tSum: number, t) => tSum + t.concepts.length, 0),
    0
  );

  if (!isAuthenticated) {
    return (
      <div className="text-center mt-10 text-gray-600">
        Zaloguj się, aby zobaczyć plan nauki.
      </div>
    );
  }

  // 🆕 Pokaż loader podczas ładowania profilu ucznia
  if (loadingProfile) {
    return (
      <div className="max-w-6xl mx-auto mt-6">
        <div className="bg-white rounded-xl shadow-lg p-6 flex items-center justify-center">
          <Loader className="animate-spin mr-2 text-blue-500" size={24} />
          <span className="text-gray-700">Ładowanie danych ucznia...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto mt-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">Plan Nauki</h1>
        <p className="text-gray-600">
          Twoja klasa: <span className="font-semibold">{studentClass}</span>
        </p>
      </div>

      {/* Sekcja Filtrów */}
      <div className="bg-white rounded-xl shadow-lg p-4 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-gray-800 flex items-center">
            <Filter size={20} className="mr-2" />
            Filtrowanie
          </h2>
          {(selectedSubject || selectedTopic || searchQuery) && (
            <button
              onClick={clearFilters}
              className="text-sm text-red-600 hover:text-red-800 flex items-center"
            >
              <X size={16} className="mr-1" />
              Wyczyść filtry
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Filtr: Przedmiot */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Przedmiot
            </label>
            <select
              value={selectedSubject}
              onChange={(e) => {
                setSelectedSubject(e.target.value);
                setSelectedTopic('');
              }}
              className="w-full p-2 border border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500 text-sm"
            >
              <option value="">Wszystkie przedmioty</option>
              {subjects.map((subject: string) => (
                <option key={subject} value={subject}>
                  {subject}
                </option>
              ))}
            </select>
          </div>

          {/* Filtr: Temat */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Temat
            </label>
            <select
              value={selectedTopic}
              onChange={(e) => setSelectedTopic(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500 text-sm"
              disabled={!selectedSubject}
            >
              <option value="">Wszystkie tematy</option>
              {selectedSubject && topicsBySubject[selectedSubject]?.map((topic: string) => (
                <option key={topic} value={topic}>
                  {topic}
                </option>
              ))}
            </select>
          </div>

          {/* Wyszukiwanie */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Szukaj
            </label>
            <input
              type="text"
              placeholder="Szukaj w tematach, konceptach..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500 text-sm"
            />
          </div>
        </div>

        {/* Statystyki */}
        {curriculumData && (
          <div className="mt-4 pt-4 border-t border-gray-200">
            <div className="flex gap-6 text-sm text-gray-600">
              <span>
                Wyświetlane: <strong>{filteredData.length}</strong> przedmiotów
              </span>
              <span>
                <strong>{totalTopicsFiltered}</strong> tematów
              </span>
              <span>
                <strong>{totalConceptsFiltered}</strong> pojęć
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Loading */}
      {loading && (
        <div className="bg-white rounded-xl shadow-lg p-6 flex items-center justify-center">
          <Loader className="animate-spin mr-2 text-blue-500" size={24} />
          <span className="text-gray-700">Ładowanie danych curriculum...</span>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-lg">
          <p className="text-red-700 font-medium">Błąd: {error}</p>
        </div>
      )}

      {/* Wyświetlanie Danych Curriculum */}
      {!loading && !error && curriculumData && (
        <div className="space-y-6">
          {filteredData.length === 0 ? (
            <div className="bg-white rounded-xl shadow-lg p-6 text-center text-gray-500">
              Brak danych spełniających kryteria filtrowania.
            </div>
          ) : (
            filteredData.map((subject: CurriculumSubject) => (
              <div key={subject.subject} className="bg-white rounded-xl shadow-lg overflow-hidden">
                {/* Nagłówek Przedmiotu */}
                <div className="bg-blue-500 text-white p-4">
                  <h2 className="text-2xl font-bold flex items-center">
                    <BookOpen size={24} className="mr-2" />
                    {subject.subject}
                  </h2>
                  <p className="text-sm text-blue-100 mt-1">
                    {subject.topics.length} {subject.topics.length === 1 ? 'temat' : 'tematów'}
                  </p>
                </div>

                {/* Tematy - Accordion Style */}
                <div className="p-4 space-y-2">
                  {subject.topics.map((topic, topicIndex) => {
                    const isExpanded = expandedTopics.has(topic.topicId);
                    
                    return (
                      <div
                        key={topic.topicId}
                        className="border border-gray-200 rounded-lg overflow-hidden"
                      >
                        {/* Belka nagłówka - klikalna */}
                        <div
                          onClick={() => toggleTopic(topic.topicId)}
                          className="flex items-center justify-between p-4 bg-gray-50 hover:bg-gray-100 cursor-pointer transition"
                        >
                          <div className="flex items-center gap-3 flex-1">
                            <span className="text-gray-400 text-sm">
                              {isExpanded ? '▼' : '▶'}
                            </span>
                            <h3 className="text-base font-semibold text-gray-800">
                              {topicIndex + 1}. {topic.topicName}
                            </h3>
                            <span className="text-xs bg-blue-100 text-blue-600 px-2 py-1 rounded">
                              {topic.concepts.length} pojęć
                            </span>
                          </div>
                          
                          {/* Przycisk: Pokaż zapisane kartkówki */}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleShowQuizzesForTopic(
                                subject.subject,
                                topic.topicName,
                                topic.topicId,
                                topic.concepts.map(c => c.conceptId)
                              );
                            }}
                            className="flex items-center gap-2 bg-green-500 hover:bg-green-600 text-white text-sm font-medium px-3 py-1.5 rounded-lg shadow-md transition duration-200"
                            title="Pokaż zapisane kartkówki na ten temat"
                          >
                            <FileText size={14} />
                            <span className="hidden sm:inline text-xs">Kartkówki</span>
                          </button>
                        </div>

                        {/* Rozwinięta zawartość */}
                        {isExpanded && (
                          <div className="p-4 bg-white border-t border-gray-200">
                            {/* Cele Nauczania - scrollable 34 linie (~544px) */}
                            {topic.curriculumObjectives.length > 0 && (
                              <div className="mb-4">
                                <h4 className="text-sm font-semibold text-gray-700 flex items-center mb-2">
                                  <Target size={16} className="mr-1 text-green-600" />
                                  Cele nauczania:
                                </h4>
                                <div 
                                  className="overflow-y-auto border border-gray-200 rounded-lg p-3 bg-gray-50"
                                  style={{ maxHeight: '240px' }}
                                >
                                  <ul className="list-disc list-inside space-y-1 text-sm text-gray-600">
                                    {topic.curriculumObjectives.map((objective: string, idx: number) => (
                                      <li key={idx}>{objective}</li>
                                    ))}
                                  </ul>
                                </div>
                              </div>
                            )}

                            {/* Pojęcia (Concepts) - scrollable 3 linie (~48px per concept) */}
                            {topic.concepts.length > 0 && (
                              <div>
                                <h4 className="text-sm font-semibold text-gray-700 flex items-center mb-2">
                                  <Lightbulb size={16} className="mr-1 text-yellow-600" />
                                  Kluczowe pojęcia:
                                </h4>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                  {topic.concepts.map((concept) => (
                                    <div
                                      key={concept.conceptId}
                                      className="bg-gray-50 border border-gray-200 rounded-lg overflow-hidden"
                                    >
                                      <div className="p-3">
                                        <p className="font-medium text-gray-800 text-sm mb-2">
                                          {concept.conceptName}
                                        </p>
                                        <div 
                                          className="overflow-y-auto text-xs text-gray-600"
                                          style={{ maxHeight: '48px' }}
                                        >
                                          {concept.definition}
                                        </div>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};

export default StudyPlanPage;