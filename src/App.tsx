import React, { useState, useEffect } from 'react';
import { useMsal } from '@azure/msal-react';
import EditStudentDataModal from './EditStudentDataModal';
import StudentProfileModal from './StudentProfileModal';
import { Settings, BookOpen, Send, Loader, AlertTriangle, ChevronDown, ChevronUp, ScrollText, StickyNote, GitGraph, User } from 'lucide-react';
import logo from './Logo_Kartkowka.png';

// Definicja typów dla danych profilu (musi być zgodna z StudentProfileModal.tsx)
interface StudentProfile {
  learningStyle: string[];
  preferredDetailLevel: 'Concise' | 'Standard' | 'Detailed';
  preferredDifficultyLevel: 'Beginner' | 'Intermediate' | 'Advanced';
  interests: string;
}

// Domyślne wartości dla profilu ucznia
const initialProfile: StudentProfile = {
  learningStyle: [],
  preferredDetailLevel: 'Standard',
  preferredDifficultyLevel: 'Intermediate',
  interests: '',
};

// Typ dla danych do zapisania (może zawierać częściowe dane)
interface SaveStudentDataPayload {
  name?: string;
  schoolName?: string;
  className?: string;
  profile?: StudentProfile;
  likedMaterialIds?: string[];
}

// Typ dla wygenerowanych materiałów - ZMIANA: Dodano consistencyWarning
interface GeneratedMaterials {
  notes: string;
  flashcards: string;
  mindMapDescription: string;
  quizSessionId: string;
  materialsUsedInSession: Array<{ materialId: string; contentType: string; topic: string }>;
  consistencyWarning?: string; // Nowe opcjonalne pole
}

// Nowy typ dla fiszek, aby łatwiej je renderować
interface Flashcard {
  term: string;
  definition: string;
}

const App: React.FC = () => {
  const { instance, accounts } = useMsal();
  const isAuthenticated = accounts.length > 0;
  const username = accounts[0]?.username || '';
  const [displayName, setDisplayName] = useState(accounts[0]?.name || username);
  const [schoolName, setSchoolName] = useState<string>('');
  const [className, setClassName] = useState<string>('');
  const [message, setMessage] = useState<string>('');
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState<boolean>(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState<boolean>(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState<boolean>(false); // NOWY STAN

  const [studentProfileData, setStudentProfileData] = useState<StudentProfile>(initialProfile);
  const [likedMaterialIds, setLikedMaterialIds] = useState<string[]>([]);

  // Nowe stany dla generowania materiałów
  const [quizTopic, setQuizTopic] = useState<string>('');
  const [generatedMaterials, setGeneratedMaterials] = useState<GeneratedMaterials | null>(null);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [generateError, setGenerateError] = useState<string>('');

  // Stany do zarządzania widocznością sekcji
  const [isMaterialsVisible, setIsMaterialsVisible] = useState<boolean>(true);
  const [areNotesVisible, setAreNotesVisible] = useState<boolean>(false);
  const [areFlashcardsVisible, setAreFlashcardsVisible] = useState<boolean>(false);
  const [isMindMapVisible, setIsMindMapVisible] = useState<boolean>(false);
  const [isTestsVisible, setIsTestsVisible] = useState<boolean>(true);

  // Funkcja do pobierania danych ucznia
  useEffect(() => {
    const fetchStudentData = async () => {
      if (isAuthenticated && username) {
        const apiEndpoint = process.env.NODE_ENV === 'development'
          ? `http://localhost:7071/api/getStudentData?username=${username}`
          : `/api/getStudentData?username=${username}`;

        try {
          const response = await fetch(apiEndpoint);
          if (response.ok) {
            const data = await response.json();
            setSchoolName(data.schoolName || '');
            setClassName(data.className || '');
            
            if (data.name) {
              setDisplayName(data.name);
              if (accounts[0]) {
                accounts[0].name = data.name;
              }
            } else {
              setDisplayName(username.split('@')[0]);
            }

            setStudentProfileData(data.profile || initialProfile);
            setLikedMaterialIds(data.likedMaterialIds || []);

            setMessage(''); 
          } else if (response.status === 404) {
            setMessage('Brak danych ucznia. Uzupełnij informacje.');
            setSchoolName('');
            setClassName('');
            setStudentProfileData(initialProfile);
            setLikedMaterialIds([]);
          } else {
            const errorText = await response.text();
            setMessage(`Błąd podczas ładowania danych: ${errorText}`);
          }
        } catch (error) {
          setMessage(`Wystąpił błąd sieci podczas ładowania danych: ${error}`);
        }
      } else {
        setSchoolName('');
        setClassName('');
        setDisplayName('');
        setStudentProfileData(initialProfile);
        setLikedMaterialIds([]);
        setMessage('');
        setIsEditModalOpen(false);
        setIsProfileModalOpen(false);
        setQuizTopic('');
        setGeneratedMaterials(null);
        setIsGenerating(false);
        setGenerateError('');
      }
    };

    fetchStudentData();
  }, [isAuthenticated, username, accounts]);

  const handleLogin = () => {
    instance.loginRedirect({ scopes: ['openid', 'profile', 'email'] });
  };

  const handleLogout = () => {
    instance.logoutRedirect();
  };

  const handleSaveStudentData = async (payload: SaveStudentDataPayload) => {
    if (!isAuthenticated) {
      setMessage('Musisz być zalogowany, aby zapisać dane.');
      return;
    }

    setIsSaving(true);
    setMessage('Zapisywanie danych...');

    try {
      const apiEndpoint = process.env.NODE_ENV === 'development'
        ? 'http://localhost:7071/api/saveStudentData'
        : '/api/saveStudentData';
      
      const dataToSend = {
        username: username,
        name: payload.name !== undefined ? payload.name : displayName,
        schoolName: payload.schoolName !== undefined ? payload.schoolName : schoolName,
        className: payload.className !== undefined ? payload.className : className,
        profile: payload.profile !== undefined ? payload.profile : studentProfileData,
        likedMaterialIds: payload.likedMaterialIds !== undefined ? payload.likedMaterialIds : likedMaterialIds,
      };

      const response = await fetch(apiEndpoint, { 
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dataToSend),
      });

      if (response.ok) {
        if (payload.name !== undefined) setDisplayName(payload.name);
        if (payload.schoolName !== undefined) setSchoolName(payload.schoolName);
        if (payload.className !== undefined) setClassName(payload.className);
        if (payload.profile !== undefined) setStudentProfileData(payload.profile);
        if (payload.likedMaterialIds !== undefined) setLikedMaterialIds(payload.likedMaterialIds);

        if (accounts[0] && payload.name !== undefined) {
          accounts[0].name = payload.name;
        }

        setMessage('Dane ucznia zostały zapisane pomyślnie!');
        setIsEditModalOpen(false);
        setIsProfileModalOpen(false);
        setTimeout(() => setMessage(''), 3000);
      } else {
        const errorText = await response.text();
        setMessage(`Błąd podczas zapisywania danych: ${errorText}`);
      }
    } catch (error) {
      setMessage(`Wystąpił błąd sieci: ${error}`);
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveBasicData = async (newSchoolName: string, newClassName: string, newDisplayName: string) => {
    await handleSaveStudentData({
      schoolName: newSchoolName,
      className: newClassName,
      name: newDisplayName,
    });
  };

  const handleSaveProfileData = (profileData: StudentProfile) => {
    handleSaveStudentData({
      profile: profileData,
    });
  };

  // NOWA FUNKCJA: Obsługa generowania materiałów
  const handleGenerateLearningMaterials = async () => {
    if (!isAuthenticated) {
      setGenerateError('Musisz być zalogowany, aby generować materiały.');
      return;
    }
    if (!quizTopic.trim()) {
      setGenerateError('Proszę podać temat kartkówki.');
      return;
    }

    setIsGenerating(true);
    setGeneratedMaterials(null);
    setGenerateError('');

    try {
      const apiEndpoint = process.env.NODE_ENV === 'development'
        ? 'http://localhost:7071/api/generateLearningMaterials'
        : '/api/generateLearningMaterials';
      
      const response = await fetch(apiEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic: quizTopic,
          username: username,
        }),
      });

      if (response.ok) {
        const data: GeneratedMaterials = await response.json();
        setGeneratedMaterials(data);
        setGenerateError('');
        setMessage('Materiały wygenerowane pomyślnie!');
        setTimeout(() => setMessage(''), 3000);
        setIsMaterialsVisible(true); 
        setAreNotesVisible(false);
        setAreFlashcardsVisible(false);
        setIsMindMapVisible(false);
      } else {
        const errorText = await response.text();
        setGenerateError(`Błąd podczas generowania materiałów: ${errorText}`);
        setMessage(`Błąd podczas generowania materiałów: ${errorText}`);
      }
    } catch (error) {
      setGenerateError(`Wystąpił błąd sieci podczas generowania materiałów: ${error}`);
      setMessage(`Wystąpił błąd sieci podczas generowania materiałów: ${error}`);
    } finally {
      setIsGenerating(false);
    }
  };

  // NOWA FUNKCJA: Obsługa generowania testów - jeszcze nie zaimplementowana
  const handleGenerateTests = () => {
    setGenerateError('Funkcja generowania testów jest jeszcze w fazie rozwoju.');
    setIsTestsVisible(true); 
    setIsMaterialsVisible(false); 
    setTimeout(() => setGenerateError(''), 3000);
  };




  // Helper do renderowania fiszek
const renderFlashcards = (flashcardText: string) => {
  if (!flashcardText) return <p>Brak fiszek.</p>;

  const flashcardsArray = flashcardText
    .split('**Pytanie')
    .slice(1)
    .map(block => {
      const questionEndIndex = block.indexOf('**');
      const questionText = block.substring(questionEndIndex + 2).trim();

      const answerStartIndex = questionText.indexOf('**Odpowiedź');
      const term = questionText.substring(0, answerStartIndex).trim();
      const definition = questionText.substring(answerStartIndex + '**Odpowiedź '.length).trim();

      const cleanTerm = term.replace(/[0-9]/g, '').trim();
      const cleanDefinition = definition.replace(/[0-9]/g, '').replace(/\*\*/g, '').trim();

      return { term: cleanTerm, definition: cleanDefinition };
    });

  return (
    <div className="flex flex-wrap gap-4 p-4">
      {flashcardsArray.map((card, index) => (
        <div
          key={index}
          className="relative bg-yellow-200 text-gray-800 p-4 rounded-md shadow-md transform transition-transform hover:scale-105 cursor-pointer w-64 h-40 flex flex-col justify-between overflow-hidden"
          onClick={() => alert(`Pytanie: ${card.term}\n\nOdpowiedź: ${card.definition}`)}
        >
          <div className="flex-1 overflow-hidden">
            <p className="font-bold text-sm mb-1 line-clamp-3">{card.term}</p>
            <p className="text-sm line-clamp-6">{card.definition}</p>
          </div>
        </div>
      ))}
    </div>
  );
};




  return (
    <div className="min-h-screen bg-white text-gray-900 font-sans">
    {/* 1. Górny pasek, z danymi ucznia, logo i przyciskami - ograniczony szerokością */}
    <div className="w-full max-w-6xl mx-auto p-4">
        <div className="flex justify-between items-start w-full mb-4">
            {/* Lewa kolumna - dane ucznia */}
            {isAuthenticated && (
                <div className="w-1/4 flex flex-col items-start space-y-1">
                    <p className="text-xl font-bold text-gray-600">Cześć {displayName || 'Nie podano'}</p>
                    <p className="text-sm text-gray-600">Szkoła: {schoolName || 'Nie podano'}</p>
                    <p className="text-sm text-gray-600">Klasa: {className || 'Nie podano'}</p>
                </div>
            )}

            {/* Środkowa kolumna - nagłówek */}
            <div className={`flex-1 flex justify-center items-start ${isAuthenticated ? 'mx-2' : ''}`}>  
                <img src={logo} alt="Logo Kartkówka" className="mx-auto" />  
            </div>

            {/* Prawa kolumna - logowanie i menu */}
            <div className="w-1/4 text-right relative">
                {isAuthenticated ? (
                    <>
                        <button
                            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                            className="p-2 rounded-full bg-gray-200 hover:bg-gray-300 transition duration-200"
                            disabled={isSaving || isGenerating}
                        >
                            <User size={24} className="text-gray-600" />
                        </button>
                        {isDropdownOpen && (
                            <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-200 rounded-md shadow-lg z-10">
                                <button
                                    onClick={() => { setIsEditModalOpen(true); setIsDropdownOpen(false); }}
                                    className="w-full text-left flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition duration-150"
                                >
                                    <Settings size={16} className="mr-2" /> Edytuj dane podstawowe
                                </button>
                                <button
                                    onClick={() => { setIsProfileModalOpen(true); setIsDropdownOpen(false); }}
                                    className="w-full text-left flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition duration-150"
                                >
                                    <BookOpen size={16} className="mr-2" /> Profil
                                </button>
                                <div className="border-t border-gray-200"></div>
                                <button
                                    onClick={() => { handleLogout(); setIsDropdownOpen(false); }}
                                    className="w-full text-left flex items-center px-4 py-2 text-sm text-red-600 hover:bg-gray-100 transition duration-150"
                                >
                                    Wyloguj
                                </button>
                            </div>
                        )}
                    </>
                ) : (
                    <>
                        <p className="text-sm text-gray-700 mb-2">Zaloguj się, aby rozpocząć.</p>
                        <button
                            onClick={handleLogin}
                            className="bg-green-500 hover:bg-green-600 text-white text-sm font-bold py-1 px-4 rounded-lg shadow-md transition duration-200"
                        >
                            Zaloguj się
                        </button>
                    </>
                )}
            </div>
        </div>
    </div>
    
    {/* 2. Jasnobłękitny pasek - rozciągnięty na całą szerokość ekranu */}
    <div className="w-full bg-blue-100 py-2 px-4 shadow-sm text-center text-sm text-gray-700">
        {/* Treść Twojego błękitnego paska */}
        Ucz się dziecko ucz, bo nauka to potęgi klucz - a "Kartkówka" Ci w tym pomoże.
    </div>

    {/* 3. Główna zawartość strony, z formularzem i sekcjami materiałów - ograniczona szerokością */}
    <div className="w-full max-w-6xl mx-auto p-4">
        {/* Główna zawartość strony - Generowanie materiałów */}
        <div className="flex-1 flex flex-col items-center p-2 w-full">
            {isAuthenticated ? (
                <div className="w-full max-w-6xl space-y-4">
                    {/* Sekcja 1: Generowanie */}
                    <div className="bg-white rounded-xl shadow-lg p-4 w-full">
                        <h2 className="text-xl font-bold text-gray-800 mb-2 border-b pb-1">Kartkówka na temat:</h2>
                        <div className="flex flex-col sm:flex-row gap-2 items-center">
                            <input
                                type="text"
                                placeholder="Wprowadź temat kartkówki (np. 'Fotosynteza')"
                                value={quizTopic}
                                onChange={(e) => setQuizTopic(e.target.value)}
                                className="flex-1 p-2 border border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500 text-sm"
                                disabled={isGenerating}
                            />
                            <button
                                onClick={handleGenerateLearningMaterials}
                                className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-lg shadow-md transition duration-200 flex items-center justify-center sm:w-auto w-full text-sm"
                                disabled={isGenerating || !quizTopic.trim()}
                            >
                                {isGenerating ? (
                                    <>
                                        <Loader className="animate-spin mr-1" size={16} />
                                        Generowanie...
                                    </>
                                ) : (
                                    <>
                                        <Send className="mr-1" size={16} />
                                        Generuj Materiały
                                    </>
                                )}
                            </button>
                            <button
                                onClick={handleGenerateTests}
                                className="bg-orange-500 hover:bg-orange-600 text-white font-bold py-2 px-4 rounded-lg shadow-md transition duration-200 flex items-center justify-center sm:w-auto w-full text-sm"
                                disabled={isGenerating || !quizTopic.trim()}
                            >
                                <Send className="mr-1" size={16} />
                                Generuj Testy
                            </button>
                        </div>
                        {generateError && (
                            <div className="bg-red-100 text-red-700 p-2 rounded-lg text-xs mt-2">
                                {generateError}
                            </div>
                        )}
                    </div>
                    
                    {/* Sekcja 2: Materiały do nauki */}
                    {generatedMaterials && (
                        <div className="bg-white rounded-xl shadow-lg w-full">
                            <div
                                className="p-3 cursor-pointer flex justify-between items-center border-b"
                                onClick={() => setIsMaterialsVisible(!isMaterialsVisible)}
                            >
                                <h2 className="text-xl font-bold text-gray-800">Materiały do nauki</h2>
                                {isMaterialsVisible ? <ChevronUp /> : <ChevronDown />}
                            </div>
                            {isMaterialsVisible && (
                                <div className="p-3 space-y-4">
                                    {generatedMaterials.consistencyWarning && (
                                        <div className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-3 rounded-lg flex items-start space-x-2">
                                            <AlertTriangle size={20} className="flex-shrink-0 text-yellow-600 mt-1" />
                                            <div>
                                                <p className="font-bold text-base mb-1">Ostrzeżenie o Spójności:</p>
                                                <p className="text-xs whitespace-pre-wrap">{generatedMaterials.consistencyWarning}</p>
                                                <p className="text-xs mt-1 text-yellow-800">
                                                    Powyższe ostrzeżenie pochodzi od modelu AI i może wymagać weryfikacji.
                                                </p>
                                            </div>
                                        </div>
                                    )}

                                    {/* Sekcja 2.A: Notatki */}
                                    <div className="border border-gray-200 rounded-lg overflow-hidden">
                                        <div
                                            className="p-3 bg-gray-50 flex justify-between items-center cursor-pointer"
                                            onClick={() => setAreNotesVisible(!areNotesVisible)}
                                        >
                                            <h4 className="flex items-center text-base font-semibold text-gray-700">
                                                <ScrollText size={16} className="mr-2 text-blue-500" /> Notatki
                                            </h4>
                                            {areNotesVisible ? <ChevronUp /> : <ChevronDown />}
                                        </div>
                                        {areNotesVisible && (
                                            <div 
                                                className="p-4 bg-white text-gray-800" 
                                                style={{ 
                                                    background: `url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="100%" height="100%"><rect width="100%" height="100%" fill="white"/><line x1="0" y1="20" x2="100%" y2="20" stroke="lightblue" stroke-width="1"/><line x1="0" y1="40" x2="100%" y2="40" stroke="lightblue" stroke-width="1"/><line x1="0" y1="60" x2="100%" y2="60" stroke="lightblue" stroke-width="1"/><line x1="0" y1="80" x2="100%" y2="80" stroke="lightblue" stroke-width="1"/><line x1="0" y1="100" x2="100%" y2="100" stroke="lightblue" stroke-width="1"/><line x1="0" y1="120" x2="100%" y2="120" stroke="lightblue" stroke-width="1"/><line x1="0" y1="140" x2="100%" y2="140" stroke="lightblue" stroke-width="1"/><line x1="0" y1="160" x2="100%" y2="160" stroke="lightblue" stroke-width="1"/><line x1="0" y1="180" x2="100%" y2="180" stroke="lightblue" stroke-width="1"/><line x1="0" y1="200" x2="100%" y2="200" stroke="lightblue" stroke-width="1"/><line x1="0" y1="220" x2="100%" y2="220" stroke="lightblue" stroke-width="1"/><line x1="0" y1="240" x2="100%" y2="240" stroke="lightblue" stroke-width="1"/><line x1="0" y1="260" x2="100%" y2="260" stroke="lightblue" stroke-width="1"/><line x1="0" y1="280" x2="100%" y2="280" stroke="lightblue" stroke-width="1"/><line x1="0" y1="300" x2="100%" y2="300" stroke="lightblue" stroke-width="1"/><line x1="0" y1="320" x2="100%" y2="320" stroke="lightblue" stroke-width="1"/><line x1="0" y1="340" x2="100%" y2="340" stroke="lightblue" stroke-width="1"/><line x1="0" y1="360" x2="100%" y2="360" stroke="lightblue" stroke-width="1"/><line x1="0" y1="380" x2="100%" y2="380" stroke="lightblue" stroke-width="1"/><line x1="0" y1="400" x2="100%" y2="400" stroke="lightblue" stroke-width="1"/><line x1="0" y1="420" x2="100%" y2="420" stroke="lightblue" stroke-width="1"/><line x1="0" y1="440" x2="100%" y2="440" stroke="lightblue" stroke-width="1"/><line x1="0" y1="460" x2="100%" y2="460" stroke="lightblue" stroke-width="1"/><line x1="0" y1="480" x2="100%" y2="480" stroke="lightblue" stroke-width="1"/><line x1="0" y1="500" x2="100%" y2="500" stroke="lightblue" stroke-width="1"/><line x1="0" y1="520" x2="100%" y2="520" stroke="lightblue" stroke-width="1"/><line x1="0" y1="540" x2="100%" y2="540" stroke="lightblue" stroke-width="1"/><line x1="0" y1="560" x2="100%" y2="560" stroke="lightblue" stroke-width="1"/><line x1="0" y1="580" x2="100%" y2="580" stroke="lightblue" stroke-width="1"/><line x1="0" y1="600" x2="100%" y2="600" stroke="lightblue" stroke-width="1"/><line x1="0" y1="620" x2="100%" y2="620" stroke="lightblue" stroke-width="1"/><line x1="0" y1="640" x2="100%" y2="640" stroke="lightblue" stroke-width="1"/><line x1="0" y1="660" x2="100%" y2="660" stroke="lightblue" stroke-width="1"/><line x1="0" y1="680" x2="100%" y2="680" stroke="lightblue" stroke-width="1"/><line x1="0" y1="700" x2="100%" y2="700" stroke="lightblue" stroke-width="1"/><line x1="0" y1="720" x2="100%" y2="720" stroke="lightblue" stroke-width="1"/><line x1="0" y1="740" x2="100%" y2="740" stroke="lightblue" stroke-width="1"/><line x1="0" y1="760" x2="100%" y2="760" stroke="lightblue" stroke-width="1"/><line x1="0" y1="780" x2="100%" y2="780" stroke="lightblue" stroke-width="1"/><line x1="0" y1="800" x2="100%" y2="800" stroke="lightblue" stroke-width="1"/><line x1="0" y1="820" x2="100%" y2="820" stroke="lightblue" stroke-width="1"/><line x1="0" y1="840" x2="100%" y2="840" stroke="lightblue" stroke-width="1"/><line x1="0" y1="860" x2="100%" y2="860" stroke="lightblue" stroke-width="1"/><line x1="0" y1="880" x2="100%" y2="880" stroke="lightblue" stroke-width="1"/><line x1="0" y1="900" x2="100%" y2="900" stroke="lightblue" stroke-width="1"/><line x1="0" y1="920" x2="100%" y2="920" stroke="lightblue" stroke-width="1"/><line x1="0" y1="940" x2="100%" y2="940" stroke="lightblue" stroke-width="1"/><line x1="0" y1="960" x2="100%" y2="960" stroke="lightblue" stroke-width="1"/><line x1="0" y1="980" x2="100%" y2="980" stroke="lightblue" stroke-width="1"/><line x1="0" y1="1000" x2="100%" y2="1000" stroke="lightblue" stroke-width="1"/><line x1="20" y1="0" x2="20" y2="100%" stroke="red" stroke-width="1"/></svg>')`,
                                                    backgroundSize: '100% 100%',
                                                    minHeight: '150px',
                                                    paddingLeft: '40px', // Dodatkowy padding dla "marginesu"
                                                }}
                                            >
                                                <div className="whitespace-pre-wrap text-sm">
                                                    {generatedMaterials.notes}
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    {/* Sekcja 2.B: Fiszki */}
                                    <div className="border border-gray-200 rounded-lg overflow-hidden">
                                        <div
                                            className="p-3 bg-gray-50 flex justify-between items-center cursor-pointer"
                                            onClick={() => setAreFlashcardsVisible(!areFlashcardsVisible)}
                                        >
                                            <h4 className="flex items-center text-base font-semibold text-gray-700">
                                                <StickyNote size={16} className="mr-2 text-yellow-500" /> Fiszki
                                            </h4>
                                            {areFlashcardsVisible ? <ChevronUp /> : <ChevronDown />}
                                        </div>
                                        {areFlashcardsVisible && (
                                            <div className="p-3 bg-cover bg-center"
                                                style={{
                                                    backgroundImage: 'url(https://www.transparenttextures.com/patterns/dark-mosaic.png)',
                                                    backgroundColor: '#4b5563',
                                                    minHeight: '150px'
                                                }}>
                                                {renderFlashcards(generatedMaterials.flashcards)}
                                            </div>
                                        )}
                                    </div>

                                    {/* Sekcja 2.C: Mapa Myśli */}
                                    <div className="border border-gray-200 rounded-lg">
                                        <div
                                            className="p-3 bg-gray-50 flex justify-between items-center cursor-pointer"
                                            onClick={() => setIsMindMapVisible(!isMindMapVisible)}
                                        >
                                            <h4 className="flex items-center text-base font-semibold text-gray-700">
                                                <GitGraph size={16} className="mr-2 text-red-500" /> Mapa Myśli
                                            </h4>
                                            {isMindMapVisible ? <ChevronUp /> : <ChevronDown />}
                                        </div>
                                        {isMindMapVisible && (
                                            <div className="p-3 bg-white rounded-b-lg whitespace-pre-wrap text-gray-800 text-sm">
                                                <p className="italic text-gray-600 mb-1 text-xs">Poniżej znajdziesz opis, jak stworzyć mapę myśli. W przyszłości w tym miejscu pojawi się interaktywny graf.</p>
                                                {generatedMaterials.mindMapDescription}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                
                    {/* Sekcja 3: Testy - docelowo będzie generować quizy*/}
                    <div className="bg-white rounded-xl shadow-lg w-full">
                        <div
                            className="p-3 cursor-pointer flex justify-between items-center border-b"
                            onClick={() => setIsTestsVisible(!isTestsVisible)}
                        >
                            <h2 className="text-xl font-bold text-gray-800">Testy</h2>
                            {isTestsVisible ? <ChevronUp /> : <ChevronDown />}
                        </div>
                        {isTestsVisible && (
                            <div className="p-3">
                                <p className="text-gray-600 text-sm">
                                    Tutaj pojawią się wygenerowane testy i quizy po kliknięciu "Generuj Testy".
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            ) : (
                <div className="text-center text-gray-600">
                    Zaloguj się, aby generować materiały edukacyjne.
                </div>
            )}
        </div>

        
      </div>
      {/* Linia na dole strony */}
      <hr className="w-full border-t-2 border-gray-300 mt-auto" />
      {/* Stopka z tekstem "O nas" - na całą szerokość ekranu */}
      <div className="w-full text-center py-4 bg-white text-gray-600 text-sm">
            <a href="#" className="hover:underline">O nas</a><br/>
            <a href="#" className="hover:underline">Kontakt</a>
      </div>


      
      {/* Modal do edycji podstawowych danych */}
      {isEditModalOpen && (
        <EditStudentDataModal
          currentSchoolName={schoolName}
          currentClassName={className}
          currentDisplayName={displayName}
          onSave={handleSaveBasicData}
          onClose={() => setIsEditModalOpen(false)}
          message={message}
          isSaving={isSaving}
        />
      )}

      {/* Modal do edycji profilu ucznia */}
      {isProfileModalOpen && (
        <StudentProfileModal
          isOpen={isProfileModalOpen}
          currentProfileData={studentProfileData}
          onSave={handleSaveProfileData}
          onClose={() => setIsProfileModalOpen(false)}
          message={message}
          isSaving={isSaving}
        />
      )}
    </div>
  );
};

export default App;