import React, { useState, useEffect } from 'react'; 
import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import { useMsal } from '@azure/msal-react';
import EditStudentDataModal from './EditStudentDataModal';
import StudentProfileModal from './StudentProfileModal';
import QuizPage from './QuizPage';
import TwojeKartkowki from './YourTestsPage';
import PlanNauki from './StudyPlanPage';
import ONas from './AboutPage';
import { Settings, User, Loader, Key} from 'lucide-react';
import logo from './Logo_Kartkowka.png';
import { GeneratedTests } from './TestsSection';
import { useCurriculumData } from './hooks/useCurriculumData';
import ApiKeyModal from './ApiKeyModal';
import { CumulativePerformance } from './cumPerf';

// ============================================
// INTERFACES
// ============================================

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
  conceptName?: string;
  conceptId?: string;
  curriculumId?: string;
  curriculumTopicId?: string;
  difficulty?: string;
  tags?: string[];
  subject?: string;
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

// ============================================
// 🆕 USAGE PROGRESS BAR COMPONENT
// ============================================
interface UsageProgressBarProps {
  usedToday: number;
  dailyLimit: number;
  hasCustomKey: boolean;
  onClick: () => void;
}

const UsageProgressBar: React.FC<UsageProgressBarProps> = ({ 
  usedToday, 
  dailyLimit, 
  hasCustomKey,
  onClick 
}) => {
  if (hasCustomKey) return null;

  const percentage = dailyLimit > 0 ? (usedToday / dailyLimit) * 100 : 0;
  const isNearLimit = percentage >= 80;
  const isAtLimit = usedToday >= dailyLimit;

  return (
    <button
      onClick={onClick}
      className="flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-gray-100 transition duration-200 cursor-pointer"
      title="Kliknij aby zobaczyć szczegóły i dodać własny klucz API"
    >
      <div className="flex flex-col items-end">
        <span className={`text-xs font-semibold ${
          isAtLimit ? 'text-red-600' : 
          isNearLimit ? 'text-yellow-600' : 
          'text-gray-600'
        }`}>
          {usedToday}/{dailyLimit}
        </span>
      </div>
      <div className="w-20 h-2 bg-gray-200 rounded-full overflow-hidden">
        <div
          className={`h-full transition-all duration-300 ${
            isAtLimit ? 'bg-red-500' :
            isNearLimit ? 'bg-yellow-500' :
            'bg-blue-500'
          }`}
          style={{ width: `${Math.min(percentage, 100)}%` }}
        />
      </div>
    </button>
  );
};

// ============================================
// 🔥 API UTILITY FUNCTIONS
// ============================================

const getApiBaseUrl = () => {
  return process.env.NODE_ENV === 'development'
    ? 'http://localhost:7071/api'
    : 'https://kartkowkafunc-etaeawfubqcefcah.westeurope-01.azurewebsites.net/api';
};

const getFunctionKey = () => process.env.REACT_APP_FUNCTION_KEY as string;

// ============================================
// APP CONTENT COMPONENT
// ============================================

const AppContent: React.FC = () => {
  const { instance, accounts } = useMsal();
  const location = useLocation();
  const isAuthenticated = accounts.length > 0;
  const username = accounts[0]?.username || '';
  
  // ============================================
  // STATE - Student Data
  // ============================================
  const [displayName, setDisplayName] = useState(accounts[0]?.name || username);
  const [schoolName, setSchoolName] = useState<string>('');
  const [className, setClassName] = useState<string>('');
  
  const { curriculumData } = useCurriculumData(className);
  
  const [message, setMessage] = useState<string>('');
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState<boolean>(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState<boolean>(false);
  const [isUserDropdownOpen, setIsUserDropdownOpen] = useState<boolean>(false);
  const [isHamburgerOpen, setIsHamburgerOpen] = useState<boolean>(false);
  const [studentProfileData, setStudentProfileData] = useState<StudentProfile>(initialProfile);
  const [likedMaterialIds, setLikedMaterialIds] = useState<string[]>([]);
  const [materialFeedbacks, setMaterialFeedbacks] = useState<Record<string, MaterialFeedback>>({});

  // ============================================
  // STATE - Quiz/Session Loading
  // ============================================
  const [isLoadingSession, setIsLoadingSession] = useState<boolean>(false);
  const [loadedSessionId, setLoadedSessionId] = useState<string>('');
  const [loadedSubject, setLoadedSubject] = useState<string>('');
  const [loadedTopic, setLoadedTopic] = useState<string>('');
  const [loadedMaterials, setLoadedMaterials] = useState<GeneratedMaterials | null>(null);
  const [loadedTests, setLoadedTests] = useState<GeneratedTests | null>(null);
  const [loadedCurriculumId, setLoadedCurriculumId] = useState<string>('');
  const [loadedCurriculumTopicIds, setLoadedCurriculumTopicIds] = useState<string[]>([]);
  const [loadedTopicNames, setLoadedTopicNames] = useState<string[]>([]);
  const [loadedPrimaryConcepts, setLoadedPrimaryConcepts] = useState<string[]>([]);
  const [loadedCumulativePerformance, setLoadedCumulativePerformance] = useState<CumulativePerformance | null>(null);

  // API Key state
  const [isApiKeyModalOpen, setIsApiKeyModalOpen] = useState<boolean>(false);
  const [hasCustomKey, setHasCustomKey] = useState<boolean>(false);
  const [usageUsedToday, setUsageUsedToday] = useState<number>(0);
  const [usageDailyLimit, setUsageDailyLimit] = useState<number>(5);

  // Connection warming state
  const [isConnectionWarmed, setIsConnectionWarmed] = useState<boolean>(false);

  // ============================================
  // 🔥 EFFECT - Connection Warming (Pre-fetch)
  // ============================================
  useEffect(() => {
    const warmConnection = async () => {
      const baseUrl = getApiBaseUrl();

      try {
        console.log('🔥 Rozgrzewanie połączenia z bazą danych...');
        const startTime = Date.now();
        
        const response = await fetch(`${baseUrl}/healthCheck`, {
          method: 'GET',
          // Bez auth - endpoint jest ANONYMOUS
        });

        if (response.ok) {
          const data = await response.json();
          const elapsed = Date.now() - startTime;
          console.log(`✅ Połączenie rozgrzane w ${elapsed}ms`, data);
          setIsConnectionWarmed(true);
        } else {
          console.warn('⚠️ Health check zwrócił błąd, ale to nie krytyczne');
        }
      } catch (error) {
        console.warn('⚠️ Warming nie powiódł się (nie krytyczne):', error);
        // Nie blokuj aplikacji - warming to optymalizacja, nie wymóg
      }
    };

    // Wywołaj od razu przy montowaniu komponentu
    warmConnection();
  }, []); // Tylko raz przy starcie

  // ============================================
  // EFFECT - Load Session from localStorage
  // ============================================
  useEffect(() => {
    const loadSessionFromStorage = async () => {
      const storedSession = localStorage.getItem('loadedSession');
      const shouldLoad = localStorage.getItem('shouldLoadSession');
      
      if (storedSession && shouldLoad === 'true' && location.pathname === '/' && isAuthenticated) {
        try {
          setIsLoadingSession(true);
          const sessionData = JSON.parse(storedSession);
          
          setLoadedSessionId(sessionData.id || '');
          setLoadedSubject(sessionData.subject || '');
          setLoadedTopic(sessionData.topic || '');
          
          if (sessionData.curriculumId) {
            setLoadedCurriculumId(sessionData.curriculumId);
            setLoadedCurriculumTopicIds(sessionData.curriculumTopicIds || []);
            setLoadedTopicNames(sessionData.topicNames || []);
            setLoadedPrimaryConcepts(sessionData.primaryConcepts || []);
          }
          
          if (sessionData.materials) {
            const materialsData = sessionData.materials;
            
            setLoadedMaterials({
              notes: materialsData.notes || '',
              flashcards: materialsData.flashcards || '',
              mindMapDescription: materialsData.mindMapDescription || '',
              quizSessionId: materialsData.quizSessionId || '',
              materialsUsedInSession: materialsData.materialsUsedInSession || [],
              consistencyWarning: materialsData.consistencyWarning,
              embeddingPlot: materialsData.embeddingPlot,
            });
          }
          
          if (sessionData.tests) {
            const testsData = sessionData.tests;
            
            setLoadedTests({
              kartkowkaId: sessionData.id || sessionData.sessionId || testsData.quizSessionId || '',
              questions: testsData.questions || [],
              quizSessionId: testsData.quizSessionId || '',
            });
          }

          if (sessionData.cumulativePerformance) {
            setLoadedCumulativePerformance(sessionData.cumulativePerformance);
            console.log('📊 Wczytano cumulative z sesji:', {
              totalTests: sessionData.cumulativePerformance.totalTests,
              concepts: Object.keys(sessionData.cumulativePerformance.conceptPerformance || {}).length
            });
          }
          
          setMessage(`Wczytano sesję: ${sessionData.sessionName || 'Bez nazwy'}`);
          setTimeout(() => setMessage(''), 5000);
          
          localStorage.removeItem('loadedSession');
          localStorage.removeItem('shouldLoadSession');
          
        } catch (error) {
          console.error('Błąd podczas ładowania sesji:', error);
          setMessage('Nie udało się wczytać sesji.');
          localStorage.removeItem('loadedSession');
          localStorage.removeItem('shouldLoadSession');
        } finally {
          setIsLoadingSession(false);
        }
      }
    };

    if (isAuthenticated) {
      loadSessionFromStorage();
    }
  }, [isAuthenticated, location.pathname]);

  // ============================================
  // 🚀 EFFECT - Fetch ALL User Data (Optimized)
  // ============================================
  useEffect(() => {
    const fetchAllUserData = async () => {
      const start = performance.now();
      
      if (!isAuthenticated || !username) {
        // Wyczyść dane przy wylogowaniu
        setSchoolName('');
        setClassName('');
        setDisplayName('');
        setStudentProfileData(initialProfile);
        setLikedMaterialIds([]);
        setHasCustomKey(false);
        setUsageUsedToday(0);
        setUsageDailyLimit(5);
        setIsEditModalOpen(false);
        setIsProfileModalOpen(false);
        setLoadedSessionId('');
        setLoadedSubject('');
        setLoadedTopic('');
        setLoadedMaterials(null);
        setLoadedTests(null);
        setLoadedCumulativePerformance(null);
        setLoadedCurriculumId('');
        setLoadedCurriculumTopicIds([]);
        setLoadedTopicNames([]);
        setLoadedPrimaryConcepts([]);
        setMessage('');
        return;
      }


      try {
        console.log('📥 START');
        const t_start = performance.now();
        const functionKey = getFunctionKey();
        const baseUrl = getApiBaseUrl();

        console.log(`⏱️ Przygotowanie: ${(performance.now() - t_start).toFixed(0)}ms`);

        const t_fetch = performance.now();
        const [studentResponse, apiKeyResponse, usageResponse] = await Promise.all([
          fetch(`${baseUrl}/getStudentData?username=${encodeURIComponent(username)}`, {
            method: 'GET',
            headers: { 'x-functions-key': functionKey }
          }), 
          fetch(`${baseUrl}/updateApiKey`, {
            method: 'POST',
            headers: { 
              'Content-Type': 'application/json',
              'x-functions-key': functionKey 
            },
            body: JSON.stringify({ username, action: 'get' })
          }),
          fetch(`${baseUrl}/getUsageStatus?username=${encodeURIComponent(username)}`, {
            method: 'GET',
            headers: { 'x-functions-key': functionKey }
          })
        ]);
        
        console.log(`⏱️ Requesty (Promise.all): ${(performance.now() - t_fetch).toFixed(0)}ms`);

        // Przetwarzanie odpowiedzi - Student Data
        if (studentResponse.ok) {
          const studentData = await studentResponse.json();
          setSchoolName(studentData.schoolName || '');
          setClassName(studentData.className || '');
          setDisplayName(studentData.name || username.split('@')[0]);
          setStudentProfileData(studentData.profile || initialProfile);
          setLikedMaterialIds(studentData.likedMaterialIds || []);
          console.log('✅ Dane ucznia załadowane');
        } else if (studentResponse.status === 404) {
          setMessage('Brak danych ucznia. Uzupełnij informacje.');
          setSchoolName('');
          setClassName('');
          setStudentProfileData(initialProfile);
          setLikedMaterialIds([]);
        } else {
          const errorText = await studentResponse.text();
          console.error('❌ Błąd pobierania danych ucznia:', errorText);
        }

        // Przetwarzanie odpowiedzi - API Key Status
        if (apiKeyResponse.ok) {
          const apiKeyData = await apiKeyResponse.json();
          setHasCustomKey(apiKeyData.hasCustomKey || false);
          console.log('✅ Status API key załadowany');
        }

        // Przetwarzanie odpowiedzi - Usage Status
        if (usageResponse.ok) {
          const usageData = await usageResponse.json();
          setUsageUsedToday(usageData.used_today || 0);
          setUsageDailyLimit(usageData.daily_limit || 5);
          console.log('✅ Status wykorzystania załadowany');
        }

        console.log(`⏱️ CAŁKOWITY CZAS: ${(performance.now() - start).toFixed(0)}ms`);
        alert(`Czas: ${(performance.now() - start).toFixed(0)}ms`);

    



      } catch (error) {
        console.error('❌ Błąd pobierania danych użytkownika:', error);
        setMessage('Wystąpił błąd podczas ładowania danych');
      }
    };

    fetchAllUserData();
  }, [isAuthenticated, username]);






  // ============================================
  // HANDLERS - Auth
  // ============================================
  const handleLogin = () => instance.loginRedirect({ scopes: ['openid', 'profile', 'email'] });
  const handleLogout = () => instance.logoutRedirect();

  // 🔥 Prefetch przy hover na przycisku logowania
  const handleLoginHover = () => {
    if (!isConnectionWarmed) {
      const baseUrl = getApiBaseUrl();
      fetch(`${baseUrl}/healthCheck`).catch(() => {});
    }
  };

  // ============================================
  // HANDLERS - Student Data
  // ============================================
  const handleSaveStudentData = async (payload: SaveStudentDataPayload) => {
    if (!isAuthenticated) { 
      setMessage('Musisz być zalogowany, aby zapisać dane.'); 
      return; 
    }
    
    setIsSaving(true); 
    setMessage('Zapisywanie danych...');
    
    try {
      const baseUrl = getApiBaseUrl();
        
      const dataToSend = {
        username,
        name: payload.name ?? displayName,
        schoolName: payload.schoolName ?? schoolName,
        className: payload.className ?? className,
        profile: payload.profile ?? studentProfileData,
        likedMaterialIds: payload.likedMaterialIds ?? likedMaterialIds,
      };
      
      const response = await fetch(`${baseUrl}/saveStudentData`, { 
        method: 'POST', 
        headers: { 
          'Content-Type': 'application/json', 
          'x-functions-key': getFunctionKey()
        }, 
        body: JSON.stringify(dataToSend) 
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
        setLikedMaterialIds(Array.from(new Set([...likedMaterialIds, ...materialIds]))); 
      } else { 
        setLikedMaterialIds(likedMaterialIds.filter(id => !materialIds.includes(id))); 
      }
      
      const baseUrl = getApiBaseUrl();
        
      const response = await fetch(`${baseUrl}/materialUserFeedback`, { 
        method: 'POST', 
        headers: { 
          'Content-Type': 'application/json', 
          'x-functions-key': getFunctionKey()
        }, 
        body: JSON.stringify({ 
          username, 
          school: schoolName, 
          materials: feedback.materials, 
          isLiked: feedback.isLiked, 
          isRequired: feedback.isRequired 
        }) 
      });
      
      if (!response.ok) throw new Error('Błąd podczas zapisywania ocen materiałów');
      
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
      name: newDisplayName 
    }); 
  };
  
  const handleSaveProfileData = (profileData: StudentProfile) => { 
    handleSaveStudentData({ profile: profileData }); 
  };

  // HANDLER - API Key Updated
  const handleApiKeyUpdated = async () => {
    if (!username) return;

    try {
      const baseUrl = getApiBaseUrl();

      const response = await fetch(`${baseUrl}/updateApiKey`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-functions-key': getFunctionKey(),
        },
        body: JSON.stringify({
          username,
          action: 'get'
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setHasCustomKey(data.hasCustomKey || false);
        setUsageUsedToday(0);
      }
    } catch (error) {
      console.error('Błąd odświeżania statusu:', error);
    }
  };

  // ============================================
  // HANDLERS - Session Loading (from QuizPage)
  // ============================================
  const handleSessionDataUpdate = (
    subject: string, 
    topic: string, 
    materials: GeneratedMaterials | null, 
    tests: GeneratedTests | null, 
    sessionName: string,
    sessionId: string
  ) => {
    setLoadedSubject(subject);
    setLoadedTopic(topic);
    setLoadedMaterials(materials);
    setLoadedTests(tests);
    setLoadedSessionId(sessionId);
  };

  // Handler do zamykania hamburger menu po kliknięciu w link
  const handleLinkClick = () => {
    setIsHamburgerOpen(false);
  };

  // ============================================
  // RENDER
  // ============================================
  return (
    <div className="min-h-screen bg-white text-gray-900 font-sans flex flex-col">
      <header className="w-full bg-white">
        <div className="max-w-6xl mx-auto flex justify-between items-center p-4">
          <div className="flex items-center gap-4">
            {/* HAMBURGER MENU */}
            <div className="relative">
              <button
                onClick={() => setIsHamburgerOpen(!isHamburgerOpen)}
                className="p-2 rounded-full bg-gray-200 hover:bg-gray-300 transition duration-200 flex items-center justify-center"
                aria-label="Menu"
              >
                {/* Animowany hamburger/X */}
                <div className="w-6 h-5 flex flex-col justify-between">
                  <span
                    className={`block h-0.5 w-6 bg-gray-600 transition-all duration-300 ${
                      isHamburgerOpen ? 'rotate-45 translate-y-2' : ''
                    }`}
                  />
                  <span
                    className={`block h-0.5 w-6 bg-gray-600 transition-all duration-300 ${
                      isHamburgerOpen ? 'opacity-0' : ''
                    }`}
                  />
                  <span
                    className={`block h-0.5 w-6 bg-gray-600 transition-all duration-300 ${
                      isHamburgerOpen ? '-rotate-45 -translate-y-2' : ''
                    }`}
                  />
                </div>
              </button>
              
              {/* Dropdown menu hamburgera */}
              {isHamburgerOpen && (
                <div className="absolute left-0 mt-2 w-64 bg-white border border-gray-200 rounded-md shadow-lg z-10">
                  <Link
                    to="/"
                    onClick={handleLinkClick}
                    className="block px-4 py-3 text-sm text-gray-700 hover:bg-gray-100 transition duration-150"
                  >
                    Kartkówka
                  </Link>
                  <Link
                    to="/twoje-kartkowki"
                    onClick={handleLinkClick}
                    className="block px-4 py-3 text-sm text-gray-700 hover:bg-gray-100 transition duration-150"
                  >
                    Zapisane kartkówki
                  </Link>
                  <Link
                    to="/plan-nauki"
                    onClick={handleLinkClick}
                    className="block px-4 py-3 text-sm text-gray-700 hover:bg-gray-100 transition duration-150"
                  >
                    Plan nauki i wyniki
                  </Link>
                  <Link
                    to="/o-nas"
                    onClick={handleLinkClick}
                    className="block px-4 py-3 text-sm text-gray-700 hover:bg-gray-100 transition duration-150"
                  >
                    O Nas
                  </Link>
                </div>
              )}
            </div>

            {/* Logo */}
            <img src={logo} alt="Logo Kartkówka" className="h-10" />
          </div>

          {/* Right side: Progress Bar + User Menu */}
          <div className="flex items-center gap-2">
            {/* Usage Progress Bar */}
            {isAuthenticated && (
              <UsageProgressBar
                usedToday={usageUsedToday}
                dailyLimit={usageDailyLimit}
                hasCustomKey={hasCustomKey}
                onClick={() => setIsApiKeyModalOpen(true)}
              />
            )}

            {/* User Menu */}
            <div className="relative">
              {isAuthenticated ? (
                <>
                  <button
                    onClick={() => setIsUserDropdownOpen(!isUserDropdownOpen)}
                    className="p-2 rounded-full bg-gray-200 hover:bg-gray-300 transition duration-200"
                    disabled={isSaving}
                  >
                    <User size={24} className="text-gray-600" />
                  </button>
                  {isUserDropdownOpen && (
                    <div className="absolute right-0 mt-2 w-64 bg-white border border-gray-200 rounded-md shadow-lg z-10">
                      <button 
                        onClick={() => { setIsEditModalOpen(true); setIsUserDropdownOpen(false); }} 
                        className="w-full text-left flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition duration-150"
                      >
                        <Settings size={16} className="mr-2" /> Edytuj dane podstawowe
                      </button>
                      <button 
                        onClick={() => { setIsProfileModalOpen(true); setIsUserDropdownOpen(false); }} 
                        className="w-full text-left flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition duration-150"
                      >
                        Profil
                      </button>
                      <button 
                        onClick={() => { setIsApiKeyModalOpen(true); setIsUserDropdownOpen(false); }} 
                        className="w-full text-left flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition duration-150"
                      >
                        <Key size={16} className="mr-2" /> Klucz API do Twojego AI
                      </button>
                      <div className="border-t border-gray-200"></div>
                      <button 
                        onClick={() => { handleLogout(); setIsUserDropdownOpen(false); }} 
                        className="w-full text-left flex items-center px-4 py-2 text-sm text-red-600 hover:bg-gray-100 transition duration-150"
                      >
                        Wyloguj
                      </button>
                    </div>
                  )}
                </>
              ) : (
                <button 
                  onClick={handleLogin}
                  onMouseEnter={handleLoginHover}
                  className="bg-blue-400 hover:bg-blue-500 text-white text-sm font-bold py-1 px-4 rounded-lg shadow-md transition duration-200"
                >
                  Zaloguj się
                </button>
              )}
            </div>
          </div>
        </div>
      </header>

      {isAuthenticated && (
        <div className="max-w-6xl mx-auto w-full px-4 py-2 bg-white">
          <p className="text-gray-700 text-sm">
            Witaj <span className="font-semibold">{displayName || 'Użytkowniku'}</span>
            {schoolName && <>, {schoolName}</>}
            {className && <>, klasa {className}</>}
          </p>
        </div>
      )}

      {isAuthenticated && <hr className="w-full border-t-2 border-gray-300" />}

      <main className="flex-1 w-full max-w-6xl mx-auto p-4">
        {isLoadingSession && (
          <div className="bg-white rounded-xl shadow-lg p-6 mb-4 flex items-center justify-center">
            <Loader className="animate-spin mr-2 text-blue-500" size={24} />
            <span className="text-gray-700">Ładowanie sesji...</span>
          </div>
        )}

        <Routes>
          <Route 
            path="/" 
            element={
              isAuthenticated ? (
                <QuizPage
                  username={username}
                  schoolName={schoolName}
                  className={className}
                  likedMaterialIds={likedMaterialIds}
                  materialFeedbacks={materialFeedbacks}
                  onMaterialFeedback={handleMaterialFeedback}
                  onMessage={setMessage}
                  loadedSessionId={loadedSessionId}
                  initialSubject={loadedSubject}
                  initialTopic={loadedTopic}
                  initialMaterials={loadedMaterials}
                  initialTests={loadedTests}
                  loadedCurriculumId={loadedCurriculumId}
                  loadedCurriculumTopicIds={loadedCurriculumTopicIds}
                  loadedTopicNames={loadedTopicNames}
                  loadedPrimaryConcepts={loadedPrimaryConcepts}
                  curriculumData={curriculumData}
                  onSessionLoad={handleSessionDataUpdate}
                  initialCumulativePerformance={loadedCumulativePerformance}
                />
              ) : (
                <div className="text-center text-gray-600">
                  Zaloguj się, aby generować materiały edukacyjne.
                </div>
              )
            } 
          />
          <Route path="/twoje-kartkowki" element={<TwojeKartkowki />} />
          <Route path="/plan-nauki" element={<PlanNauki />} />
          <Route path="/o-nas" element={<ONas />} />
        </Routes>
      </main>

      <hr className="w-full border-t-2 border-gray-300" />
      <div className="w-full text-center py-4 bg-white text-gray-600 text-sm">
        Kontakt
      </div>

      {message && (
        <div className="fixed bottom-4 right-4 bg-blue-500 text-white px-4 py-2 rounded-lg shadow-lg">
          {message}
        </div>
      )}

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

      {isApiKeyModalOpen && (
        <ApiKeyModal
          isOpen={isApiKeyModalOpen}
          onClose={() => setIsApiKeyModalOpen(false)}
          username={username}
          currentHasCustomKey={hasCustomKey}
          onSaveSuccess={handleApiKeyUpdated}
        />
      )}
    </div>
  );
};

const App: React.FC = () => (
  <div className="min-h-screen bg-white">
    <Router>
      <AppContent />
    </Router>
  </div>
);

export default App;