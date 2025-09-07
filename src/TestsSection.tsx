import React, { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';

const TestsSection: React.FC = () => {
  const [isTestsVisible, setIsTestsVisible] = useState<boolean>(true);

  return (
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
  );
};

export default TestsSection;