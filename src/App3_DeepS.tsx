import React, { useState, useEffect } from 'react';
import { useMsal } from '@azure/msal-react';
import EditStudentDataModal from './EditStudentDataModal';
import StudentProfileModal from './StudentProfileModal';
import { Settings, BookOpen, Send, Loader, AlertTriangle, ChevronDown, ChevronUp, ScrollText, StickyNote, GitGraph, User } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
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

interface GeneratedMaterials {
  notes: string;
  flashcards: string;
  mindMapDescription: string;
  quizSessionId: string;
  materialsUsedInSession: Array<{ materialId: string; contentType: string; topic: string }>;
  consistencyWarning?: string;
}

const App: React.FC = () => {
  const { instance, accounts, inProgress } = useMsal();
  const [isMsalReady, setIsMsalReady] = useState(false);
  const [displayName, setDisplayName] = useState(accounts[0]?.name || '');
  const [schoolName, setSchoolName] = useState('');
  const [className, setClassName] = useState('');
  const [message, setMessage] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [studentProfileData, setStudentProfileData] = useState<StudentProfile>(initialProfile);
  const [likedMaterialIds, setLikedMaterialIds] = useState<string[]>([]);
  const [quizTopic, setQuizTopic] = useState('');
  const [generatedMaterials, setGeneratedMaterials] = useState<GeneratedMaterials | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generateError, setGenerateError] = useState('');
  const [isMaterialsVisible, setIsMaterialsVisible] = useState(true);
  const [areNotesVisible, setAreNotesVisible] = useState(false);
  const [areFlashcardsVisible, setAreFlashcardsVisible] = useState(false);
  const [isMindMapVisible, setIsMindMapVisible] = useState(false);
  const [isTestsVisible, setIsTestsVisible] = useState(true);

  useEffect(() => {
    if (inProgress === "none") {
      setIsMsalReady(true);
      if (accounts[0]?.name) {
        setDisplayName(accounts[0].name);
      }
    }
  }, [inProgress, accounts]);

  const isAuthenticated = isMsalReady && accounts.length > 0;
  const username = accounts[0]?.username || '';

  useEffect(() => {
    const fetchStudentData = async () => {
      if (isAuthenticated && username) {
        const functionKey = process.env.REACT_APP_FUNCTION_KEY as string;
        const apiEndpoint = process.env.NODE_ENV === 'development'
          ? `http://localhost:7071/api/getStudentData?username=${username}`
          : `https://kartkowkafunc-etaeawfubqcefcah.westeurope-01.azurewebsites.net/api/getStudentData?username=${username}`;

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

  if (!isMsalReady) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader className="animate-spin h-12 w-12 text-blue-500" />
        <p className="ml-4">Initializing authentication...</p>
      </div>
    );
  }

  // [Keep all your handler functions exactly as they were]
  const handleLogin = () => { /* ... */ };
  const handleLogout = () => { /* ... */ };
  const handleSaveStudentData = async (payload: SaveStudentDataPayload) => { /* ... */ };
  const handleSaveBasicData = async (newSchoolName: string, newClassName: string, newDisplayName: string) => { /* ... */ };
  const handleSaveProfileData = (profileData: StudentProfile) => { /* ... */ };
  const handleGenerateLearningMaterials = async () => { /* ... */ };
  const handleGenerateTests = () => { /* ... */ };
  const renderFlashcards = (flashcardText: string) => { /* ... */ };

  // [Keep all your JSX return exactly as it was]
  return (
    <div className="min-h-screen bg-white text-gray-900 font-sans">
      {/* Your entire existing JSX remains unchanged */}
      {/* ... */}
    </div>
  );
};

export default App;