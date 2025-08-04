import React, { useState, useEffect } from 'react';
import { useMsal } from '@azure/msal-react';
import EditStudentDataModal from './EditStudentDataModal';
import StudentProfileModal from './StudentProfileModal';
import { Settings, BookOpen, Send, Loader, AlertTriangle } from 'lucide-react'; // Import AlertTriangle

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

  const [studentProfileData, setStudentProfileData] = useState<StudentProfile>(initialProfile);
  const [likedMaterialIds, setLikedMaterialIds] = useState<string[]>([]);

  // Nowe stany dla generowania materiałów
  const [quizTopic, setQuizTopic] = useState<string>('');
  const [generatedMaterials, setGeneratedMaterials] = useState<GeneratedMaterials | null>(null);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [generateError, setGenerateError] = useState<string>('');

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


  return (
    <div className="min-h-screen bg-gray-100 text-gray-900 font-sans p-4">
      <div className="flex flex-col h-full">
        {/* Górny pasek */}
        <div className="flex justify-between items-start w-full mb-8">
          {/* Lewa kolumna - dane ucznia */}
          {isAuthenticated && (
            <div className="w-1/4 flex flex-col items-start space-y-2">
              <p className="text-sm text-gray-600">Imię i nazwisko: {displayName || 'Nie podano'}</p>
              <p className="text-sm text-gray-600">Szkoła: {schoolName || 'Nie podano'}</p>
              <p className="text-sm text-gray-600">Klasa: {className || 'Nie podano'}</p>
              <div className="flex space-x-2 mt-2">
                <button
                  onClick={() => setIsEditModalOpen(true)}
                  className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded-lg shadow-md transition duration-200 flex items-center"
                  disabled={isSaving || isGenerating}
                >
                  <Settings size={18} className="mr-2" />
                  Edytuj dane
                </button>
                <button
                  onClick={() => setIsProfileModalOpen(true)}
                  className="bg-purple-500 hover:bg-purple-600 text-white font-bold py-2 px-4 rounded-lg shadow-md transition duration-200 flex items-center"
                  disabled={isSaving || isGenerating}
                >
                  <BookOpen size={18} className="mr-2" />
                  Mój Profil
                </button>
              </div>
            </div>
          )}

          {/* Środkowa kolumna - nagłówek */}
          <div className={`flex-1 text-center ${isAuthenticated ? 'mx-4' : ''}`}>
            <h1 className="text-4xl font-bold mb-4 text-gray-800">
              🎓 Witamy {isAuthenticated ? (displayName || username.split('@')[0] || 'Użytkowniku') : ''} w aplikacji Kartkówka
            </h1>
            {isAuthenticated && (
              <p className="text-lg text-gray-700 mb-8">Jesteś zalogowany. Miłej nauki!</p>
            )}
            {message && (
              <p className={`text-md ${message.includes('Błąd') ? 'text-red-600' : 'text-green-600'} mb-4`}>
                {message}
              </p>
            )}
          </div>

          {/* Prawa kolumna - logowanie */}
          <div className="w-1/4 text-right">
            {isAuthenticated ? (
              <>
                <p className="text-lg font-semibold text-gray-800 mb-2">Login: {username}</p>
                <button
                  onClick={handleLogout}
                  className="bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-4 rounded-lg shadow-md transition duration-200"
                  disabled={isSaving || isGenerating}
                >
                  Wyloguj się
                </button>
              </>
            ) : (
              <>
                <p className="text-lg text-gray-700 mb-4">Aby rozpocząć, zaloguj się przez konto ucznia.</p>
                <button
                  onClick={handleLogin}
                  className="bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-6 rounded-lg shadow-md transition duration-200"
                >
                  Zaloguj się
                </button>
              </>
            )}
          </div>
        </div>

        {/* Główna zawartość strony - Generowanie materiałów */}
        <div className="flex-1 flex flex-col items-center justify-center p-4">
          {isAuthenticated ? (
            <div className="bg-white rounded-xl shadow-lg p-6 w-full max-w-2xl">
              <h2 className="text-2xl font-bold text-gray-800 mb-4 text-center">Generuj Materiały do Kartkówki</h2>
              <div className="flex flex-col sm:flex-row gap-4 mb-6">
                <input
                  type="text"
                  placeholder="Wprowadź temat kartkówki (np. 'Fotosynteza', 'Twierdzenie Pitagorasa')"
                  value={quizTopic}
                  onChange={(e) => setQuizTopic(e.target.value)}
                  className="flex-1 p-3 border border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500 text-base"
                  disabled={isGenerating}
                />
                <button
                  onClick={handleGenerateLearningMaterials}
                  className="bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-6 rounded-lg shadow-md transition duration-200 flex items-center justify-center sm:w-auto w-full"
                  disabled={isGenerating || !quizTopic.trim()}
                >
                  {isGenerating ? (
                    <>
                      <Loader className="animate-spin mr-2" size={20} />
                      Generowanie...
                    </>
                  ) : (
                    <>
                      <Send className="mr-2" size={20} />
                      Generuj Materiały
                    </>
                  )}
                </button>
              </div>

              {generateError && (
                <div className="bg-red-100 text-red-700 p-3 rounded-lg text-sm mb-4">
                  {generateError}
                </div>
              )}

              {generatedMaterials && (
                <div className="space-y-6 mt-6">
                  <h3 className="text-xl font-bold text-gray-800 border-b pb-2 mb-4">Wygenerowane Materiały:</h3>
                  
                  {/* Ostrzeżenie o Spójności - NOWA SEKCJA */}
                  {generatedMaterials.consistencyWarning && (
                    <div className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-4 rounded-lg flex items-start space-x-3 mb-4">
                      <AlertTriangle size={24} className="flex-shrink-0 text-yellow-600 mt-1" />
                      <div>
                        <p className="font-bold text-lg mb-1">Ostrzeżenie o Spójności:</p>
                        <p className="text-sm whitespace-pre-wrap">{generatedMaterials.consistencyWarning}</p>
                        <p className="text-xs mt-2 text-yellow-800">
                          Powyższe ostrzeżenie pochodzi od modelu AI i może wymagać weryfikacji.
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Notatki */}
                  <div>
                    <h4 className="text-lg font-semibold text-gray-700 mb-2">Notatki:</h4>
                    <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 whitespace-pre-wrap text-gray-800">
                      {generatedMaterials.notes}
                    </div>
                  </div>

                  {/* Fiszki */}
                  <div>
                    <h4 className="text-lg font-semibold text-gray-700 mb-2">Fiszki:</h4>
                    <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 whitespace-pre-wrap text-gray-800">
                      {generatedMaterials.flashcards}
                    </div>
                  </div>

                  {/* Mapa Myśli */}
                  <div>
                    <h4 className="text-lg font-semibold text-gray-700 mb-2">Opis Mapy Myśli:</h4>
                    <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 whitespace-pre-wrap text-gray-800">
                      {generatedMaterials.mindMapDescription}
                    </div>
                  </div>

                  <p className="text-sm text-gray-600 mt-4">ID Sesji Quizu: {generatedMaterials.quizSessionId}</p>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center text-gray-600">
              Zaloguj się, aby generować materiały edukacyjne.
            </div>
          )}
        </div>

        {/* Linia na dole strony */}
        <hr className="border-t-2 border-gray-300 mt-auto" />
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
//koniec2