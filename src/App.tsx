import React, { useState, useEffect } from 'react';
import { useMsal } from '@azure/msal-react';
import EditStudentDataModal from './EditStudentDataModal';
import StudentProfileModal from './StudentProfileModal';
import MaterialsSection from './MaterialsSection';
import TestsSection, { GeneratedTests } from './TestsSection'; // POPRAWIONY IMPORT
import { 
  Settings, 
  BookOpen, 
  User,
  Send,
  Loader
} from 'lucide-react'; 
import logo from './Logo_Kartkowka.png';

interface StudentProfile {
  learningStyle: string[];
  preferredDetailLevel: 'Concise' | 'Standard' | 'Detailed';
  preferredDifficultyLevel: 'Beginner' | 'Intermediate' | 'Advanced';
  interests: string;
}

const initialProfile: StudentProfile = {
  learningStyle: [],
  preferredDetailLevel: 'Standard',
  preferredDifficultyLevel: 'Intermediate',
  interests: '',
};

interface SaveStudentDataPayload {
  name?: string;
  schoolName?: string;
  className?: string;
  profile?: StudentProfile;
  likedMaterialIds?: string[];
}

interface MaterialUsedInSession {
  materialId: string;
  partition_key_m: string;
  contentType: string;
  topic: string;
  klasa?: string | number;
  similarityScore?: number;
  total_likes?: number;
  school_likes?: number;
  school_dedicated?: boolean;
}

interface GeneratedMaterials {
  notes: string;
  flashcards: string;
  mindMapDescription: string;
  quizSessionId: string;
  materialsUsedInSession: MaterialUsedInSession[];
  consistencyWarning?: string;
  embeddingPlot?: string;
}

interface MaterialFeedback {
  materials: { materialId: string; partitionKey: string }[];
  isLiked: boolean;
  isRequired: boolean;
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
  const [isDropdownOpen, setIsDropdownOpen] = useState<boolean>(false);

  const [studentProfileData, setStudentProfileData] = useState<StudentProfile>(initialProfile);
  const [likedMaterialIds, setLikedMaterialIds] = useState<string[]>([]);
  const [materialFeedbacks, setMaterialFeedbacks] = useState<Record<string, MaterialFeedback>>({});

  const [quizTopic, setQuizTopic] = useState<string>('');
  const [generatedMaterials, setGeneratedMaterials] = useState<GeneratedMaterials | null>(null);
  const [generatedTests, setGeneratedTests] = useState<GeneratedTests | null>(null);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [isGeneratingTests, setIsGeneratingTests] = useState<boolean>(false);
  const [isCheckingTests, setIsCheckingTests] = useState<boolean>(false);
  const [generateError, setGenerateError] = useState<string>('');

  useEffect(() => {
    const fetchStudentData = async () => {
      if (isAuthenticated && username) {
        const functionKey = process.env.REACT_APP_FUNCTION_KEY as string;
        const apiEndpoint = process.env.NODE_ENV === 'development'
                ? `http://localhost:7071/api/getStudentData?username=${encodeURIComponent(username)}`
                : `https://kartkowkafunc-etaeawfubqcefcah.westeurope-01.azurewebsites.net/api/getStudentData?username=${encodeURIComponent(username)}`;
        try {
            const headers = {
              'Content-Type': 'application/json',
              'x-functions-key': functionKey,
            };
          const response = await fetch(apiEndpoint, {
              method: 'GET',
              headers: headers
          });
          
          if (response.ok) {
            const data = await response.json();
            setSchoolName(data.schoolName || '');
            setClassName(data.className || '');
            setDisplayName(data.name || username.split('@')[0]);
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
        setGeneratedTests(null);
        setIsGenerating(false);
        setIsGeneratingTests(false);
        setIsCheckingTests(false);
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
      const baseUrl = process.env.NODE_ENV === 'development'
        ? 'http://localhost:7071/api/saveStudentData'
        : 'https://kartkowkafunc-etaeawfubqcefcah.westeurope-01.azurewebsites.net/api/saveStudentData';
      
      const dataToSend = {
        username,
        name: payload.name ?? displayName,
        schoolName: payload.schoolName ?? schoolName,
        className: payload.className ?? className,
        profile: payload.profile ?? studentProfileData,
        likedMaterialIds: payload.likedMaterialIds ?? likedMaterialIds,
      };

      const response = await fetch(baseUrl, { 
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'x-functions-key': process.env.REACT_APP_FUNCTION_KEY as string, 
        },
        body: JSON.stringify(dataToSend),
      });

      if (response.ok) {
        if (payload.name !== undefined) setDisplayName(payload.name);
        if (payload.schoolName !== undefined) setSchoolName(payload.schoolName);
        if (payload.className !== undefined) setClassName(payload.className);
        if (payload.profile !== undefined) setStudentProfileData(payload.profile);
        if (payload.likedMaterialIds !== undefined) setLikedMaterialIds(payload.likedMaterialIds);

        setMessage('Dane ucznia zostały zapisane pomyślnie!');
        setIsEditModalOpen(false);
        setIsProfileModalOpen(false);
        setTimeout(() => setMessage(''), 3000);
      } else {
        const errorText = await response.text();
        setMessage(`Błąd podczas zapisywania danych: ${errorText}`);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      setMessage(`Wystąpił błąd sieci: ${errorMessage}`);
    } finally {
      setIsSaving(false);
    }
  };

  const handleMaterialFeedback = async (feedback: MaterialFeedback) => {
    try {
      const newFeedbacks = { ...materialFeedbacks };
      feedback.materials.forEach(material => {
        newFeedbacks[material.materialId] = feedback;
      });
      setMaterialFeedbacks(newFeedbacks);
      
      const materialIds = feedback.materials.map(m => m.materialId);
      if (feedback.isLiked) {
        const newLikedIds = Array.from(new Set([...likedMaterialIds, ...materialIds]));
        setLikedMaterialIds(newLikedIds);
      } else {
        const newLikedIds = likedMaterialIds.filter(id => !materialIds.includes(id));
        setLikedMaterialIds(newLikedIds);
      }
      
      const apiEndpoint = process.env.NODE_ENV === 'development'
        ? 'http://localhost:7071/api/materialUserFeedback'
        : 'https://kartkowkafunc-etaeawfubqcefcah.westeurope-01.azurewebsites.net/api/materialUserFeedback';
      
      const response = await fetch(apiEndpoint, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'x-functions-key': process.env.REACT_APP_FUNCTION_KEY as string, 
        },
        body: JSON.stringify({
          username,
          school: schoolName,
          materials: feedback.materials,
          isLiked: feedback.isLiked,
          isRequired: feedback.isRequired
        }),
      });
      
      if (!response.ok) {
        throw new Error('Błąd podczas zapisywania ocen materiałów');
      }
      
      setMessage('Dziękujemy za ocenę materiałów!');
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      setMessage('Wystąpił błąd podczas zapisywania ocen. Spróbuj ponownie.');
      console.error('Error saving material feedback:', error);
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
    setGeneratedTests(null);
    setGenerateError('');

    try {
      const apiEndpoint = process.env.NODE_ENV === 'development'
        ? `http://localhost:7071/api/generateLearningMaterials`
        : `https://kartkowkafunc-etaeawfubqcefcah.westeurope-01.azurewebsites.net/api/generateLearningMaterials`;

      const response = await fetch(apiEndpoint, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'x-functions-key': process.env.REACT_APP_FUNCTION_KEY as string, 
        },
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

  const handleGenerateTests = async () => {
    if (!isAuthenticated) {
      setGenerateError('Musisz być zalogowany, aby generować testy.');
      return;
    }
    if (!quizTopic.trim()) {
      setGenerateError('Proszę podać temat testów.');
      return;
    }

    setIsGeneratingTests(true);
    setGeneratedTests(null);
    setGenerateError('');

    try {
      const apiEndpoint = process.env.NODE_ENV === 'development'
        ? `http://localhost:7071/api/generateTests`
        : `https://kartkowkafunc-etaeawfubqcefcah.westeurope-01.azurewebsites.net/api/generateTests`;

      const response = await fetch(apiEndpoint, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'x-functions-key': process.env.REACT_APP_FUNCTION_KEY as string, 
        },
        body: JSON.stringify({
          topic: quizTopic,
          username: username,
        }),
      });
      
      if (response.ok) {
        const data: GeneratedTests = await response.json();
        setGeneratedTests(data);
        setGenerateError('');
        setMessage('Testy wygenerowane pomyślnie!');
        setTimeout(() => setMessage(''), 3000);
      } else {
        const errorText = await response.text();
        setGenerateError(`Błąd podczas generowania testów: ${errorText}`);
      }
    } catch (error) {
      setGenerateError(`Wystąpił błąd sieci podczas generowania testów: ${error}`);
    } finally {
      setIsGeneratingTests(false);
    }
  };

  const handleCheckTests = async (answers: Record<number, string>) => {
    if (!generatedTests) return;

    setIsCheckingTests(true);

    try {
      const apiEndpoint = process.env.NODE_ENV === 'development'
        ? `http://localhost:7071/api/checkTestAnswers`
        : `https://kartkowkafunc-etaeawfubqcefcah.westeurope-01.azurewebsites.net/api/checkTestAnswers`;

      const response = await fetch(apiEndpoint, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'x-functions-key': process.env.REACT_APP_FUNCTION_KEY as string, 
        },
        body: JSON.stringify({
          quizSessionId: generatedTests.quizSessionId,
          answers: answers,
          username: username,
        }),
      });
      
      if (response.ok) {
        const results = await response.json();
        setGeneratedTests((prev: GeneratedTests | null) => ({
          ...prev!,
          questions: prev!.questions.map((q: any, i: number) => ({ // DODANE TYPY
            ...q,
            userAnswer: answers[i],
            isCorrect: results.results[i]?.isCorrect
          }))
        }));
        setMessage('Testy sprawdzone pomyślnie!');
        setTimeout(() => setMessage(''), 3000);
      } else {
        const errorText = await response.text();
        setGenerateError(`Błąd podczas sprawdzania testów: ${errorText}`);
      }
    } catch (error) {
      setGenerateError(`Wystąpił błąd sieci podczas sprawdzania testów: ${error}`);
    } finally {
      setIsCheckingTests(false);
    }
  };

  return (
    <div className="min-h-screen bg-white text-gray-900 font-sans">
      <div className="w-full max-w-6xl mx-auto p-4">
          <div className="flex justify-between items-start w-full mb-4">
              {isAuthenticated && (
                  <div className="w-1/4 flex flex-col items-start space-y-1">
                      <p className="text-xl font-bold text-gray-600">Cześć {displayName || 'Nie podano'}</p>
                      <p className="text-sm text-gray-600">Szkoła: {schoolName || 'Nie podano'}</p>
                      <p className="text-sm text-gray-600">Klasa: {className || 'Nie podano'}</p>
                  </div>
              )}

              <div className={`flex-1 flex justify-center items-start ${isAuthenticated ? 'mx-2' : ''}`}>  
                  <img src={logo} alt="Logo Kartkówka" className="mx-auto" />  
              </div>

              <div className="w-1/4 text-right relative">
                  {isAuthenticated ? (
                      <>
                          <button
                              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                              className="p-2 rounded-full bg-gray-200 hover:bg-gray-300 transition duration-200"
                              disabled={isSaving || isGenerating || isGeneratingTests}
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
      
      <div className="w-full bg-blue-100 py-2 px-4 shadow-sm text-center text-sm text-gray-700">
          {isAuthenticated && (
              <p className="mt-1 text-blue-800 font-medium">Jesteś zalogowany jako: {username}</p>
          )}
      </div>

      <div className="w-full max-w-6xl mx-auto p-4">
          <div className="flex-1 flex flex-col items-center p-2 w-full">
              {isAuthenticated ? (
                  <div className="w-full max-w-6xl space-y-4">
                      <div className="bg-white rounded-xl shadow-lg p-4 w-full">
                          <h2 className="text-xl font-bold text-gray-800 mb-2 border-b pb-1">Kartkówka na temat:</h2>
                          <div className="flex flex-col sm:flex-row gap-2 items-center">
                              <input
                                  type="text"
                                  placeholder="Wprowadź temat kartkówki (np. 'Fotosynteza')"
                                  value={quizTopic}
                                  onChange={(e) => setQuizTopic(e.target.value)}
                                  className="flex-1 p-2 border border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500 text-sm"
                                  disabled={isGenerating || isGeneratingTests}
                              />
                              <button
                                  onClick={handleGenerateLearningMaterials}
                                  className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-lg shadow-md transition duration-200 flex items-center justify-center sm:w-auto w-full text-sm"
                                  disabled={isGenerating || isGeneratingTests || !quizTopic.trim()}
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
                                  disabled={isGenerating || isGeneratingTests || !quizTopic.trim()}
                              >
                                  {isGeneratingTests ? (
                                      <>
                                          <Loader className="animate-spin mr-1" size={16} />
                                          Generowanie...
                                      </>
                                  ) : (
                                      <>
                                          <Send className="mr-1" size={16} />
                                          Generuj Testy
                                      </>
                                  )}
                              </button>
                          </div>
                          {generateError && (
                              <div className="bg-red-100 text-red-700 p-2 rounded-lg text-xs mt-2">
                                  {generateError}
                              </div>
                          )}
                      </div>
                      
                      <MaterialsSection
                        generatedMaterials={generatedMaterials}
                        likedMaterialIds={likedMaterialIds}
                        materialFeedbacks={materialFeedbacks}
                        onMaterialFeedback={handleMaterialFeedback}
                        username={username}
                        schoolName={schoolName}
                        quizTopic={quizTopic}
                      />
                  
                      <TestsSection
                        generatedTests={generatedTests}
                        onCheckTests={handleCheckTests}
                        isChecking={isCheckingTests}
                      />
                  </div>
              ) : (
                  <div className="text-center text-gray-600">
                      Zaloguj się, aby generować materiały edukacyjne.
                  </div>
              )}
          </div>    
      </div>

      <hr className="w-full border-t-2 border-gray-300 mt-auto" />
      
      <div className="w-full text-center py-4 bg-white text-gray-600 text-sm">
           Kontakt
      </div>

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