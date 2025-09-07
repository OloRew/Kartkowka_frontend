import React from 'react';
import { Loader } from 'lucide-react';

interface StudentProfile {
  learningStyle: string[];
  preferredDetailLevel: 'Concise' | 'Standard' | 'Detailed';
  preferredDifficultyLevel: 'Beginner' | 'Intermediate' | 'Advanced';
  interests: string;
}

interface SaveStudentDataPayload {
  name?: string;
  schoolName?: string;
  className?: string;
  profile?: StudentProfile;
  likedMaterialIds?: string[];
}

interface StudentDataHandlingProps {
  isSaving: boolean;
  message: string;
  onSaveStudentData: (payload: SaveStudentDataPayload) => void;
}

export const handleSaveBasicData = async (
  newSchoolName: string, 
  newClassName: string, 
  newDisplayName: string,
  onSaveStudentData: (payload: SaveStudentDataPayload) => void
) => {
  await onSaveStudentData({
    schoolName: newSchoolName,
    className: newClassName,
    name: newDisplayName,
  });
};

export const handleSaveProfileData = (
  profileData: StudentProfile,
  onSaveStudentData: (payload: SaveStudentDataPayload) => void
) => {
  onSaveStudentData({
    profile: profileData,
  });
};

const StudentDataHandling: React.FC<StudentDataHandlingProps> = ({
  isSaving,
  message,
  onSaveStudentData
}) => {
  return (
    <div>
      {isSaving && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-4 rounded-lg flex items-center">
            <Loader className="animate-spin mr-2" />
            <span>Zapisywanie danych...</span>
          </div>
        </div>
      )}
      {message && (
        <div className="fixed top-4 right-4 bg-blue-100 border-l-4 border-blue-500 text-blue-700 p-4 rounded shadow-md z-50">
          {message}
        </div>
      )}
    </div>
  );
};

export default StudentDataHandling;