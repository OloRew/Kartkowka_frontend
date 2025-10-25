import React, { useState } from 'react';
import { 
  ChevronDown, 
  ChevronUp, 
  CheckCircle,
  XCircle,
  Send,
  Circle
} from 'lucide-react';

export interface TestOption {
  A: string;
  B: string;
  C: string;
  D: string;
}

export interface TestQuestion {
  question: string;
  options: TestOption;
  correctAnswer: string;
  userAnswer?: string;
  isCorrect?: boolean;
}

export interface GeneratedTests {
  questions: TestQuestion[];
  quizSessionId: string;
}

export interface TestsSectionProps {
  generatedTests?: GeneratedTests | null;
  onCheckTests?: (answers: Record<number, string>) => void;
  isChecking?: boolean;
}

const TestsSection: React.FC<TestsSectionProps> = ({
  generatedTests,
  onCheckTests,
  isChecking = false
}) => {
  const [isTestsVisible, setIsTestsVisible] = useState<boolean>(true);
  const [userAnswers, setUserAnswers] = useState<Record<number, string>>({});

  const handleAnswerSelect = (questionIndex: number, answer: string) => {
    setUserAnswers((prev: Record<number, string>) => ({
      ...prev,
      [questionIndex]: answer
    }));
  };

  const handleCheckTests = () => {
    if (onCheckTests) {
      onCheckTests(userAnswers);
    }
  };

  if (!generatedTests) return null;

  return (
    <div className="bg-white rounded-xl shadow-lg w-full mt-6">
      <div
        className="p-3 cursor-pointer flex justify-between items-center border-b"
        onClick={() => setIsTestsVisible(!isTestsVisible)}
      >
        <h2 className="text-xl font-bold text-gray-800">Wygenerowane testy</h2>
        {isTestsVisible ? <ChevronUp /> : <ChevronDown />}
      </div>

      {isTestsVisible && (
        <div className="p-3 space-y-6">
          <div className="grid gap-6">
            {generatedTests.questions.map((question: TestQuestion, index: number) => ( // DODANE TYPY
              <div key={index} className="border border-gray-200 rounded-lg p-4">
                <h3 className="text-sm font-medium text-gray-700 mb-4">
                  Pytanie {index + 1}: {question.question}
                </h3>
                
                <div className="space-y-3">
                  {(['A', 'B', 'C', 'D'] as const).map((option) => (
                    <label
                      key={option}
                      className={`flex items-center p-3 rounded-lg border-2 cursor-pointer transition-all ${
                        userAnswers[index] === option
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300'
                      } ${
                        question.isCorrect !== undefined 
                          ? question.correctAnswer === option
                            ? 'border-green-500 bg-green-50'
                            : userAnswers[index] === option && !question.isCorrect
                            ? 'border-red-500 bg-red-50'
                            : 'border-gray-200'
                          : ''
                      }`}
                    >
                      <input
                        type="radio"
                        name={`question-${index}`}
                        value={option}
                        checked={userAnswers[index] === option}
                        onChange={() => handleAnswerSelect(index, option)}
                        className="hidden"
                        disabled={question.isCorrect !== undefined}
                      />
                      <div className={`flex items-center justify-center w-6 h-6 rounded-full border-2 mr-3 ${
                        userAnswers[index] === option
                          ? 'border-blue-500 bg-blue-500 text-white'
                          : 'border-gray-300'
                      } ${
                        question.isCorrect !== undefined 
                          ? question.correctAnswer === option
                            ? 'border-green-500 bg-green-500 text-white'
                            : userAnswers[index] === option && !question.isCorrect
                            ? 'border-red-500 bg-red-500 text-white'
                            : 'border-gray-300'
                          : ''
                      }`}>
                        {userAnswers[index] === option ? (
                          <Circle size={14} fill="currentColor" />
                        ) : (
                          <Circle size={14} />
                        )}
                      </div>
                      <span className="font-medium mr-2">{option})</span>
                      <span className="text-gray-700">{question.options[option]}</span>
                    </label>
                  ))}
                </div>

                {question.isCorrect !== undefined && (
                  <div className={`mt-4 p-3 rounded-lg ${
                    question.isCorrect ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'
                  }`}>
                    <div className={`flex items-center text-sm font-medium ${
                      question.isCorrect ? 'text-green-700' : 'text-red-700'
                    }`}>
                      {question.isCorrect ? (
                        <>
                          <CheckCircle size={16} className="mr-2" />
                          Poprawna odpowiedź!
                        </>
                      ) : (
                        <>
                          <XCircle size={16} className="mr-2" />
                          Błędna odpowiedź
                        </>
                      )}
                    </div>
                    {!question.isCorrect && (
                      <p className="text-sm text-gray-600 mt-1">
                        Poprawna odpowiedź: <strong>{question.correctAnswer}) {question.options[question.correctAnswer as keyof TestOption]}</strong>
                      </p>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className="flex justify-between items-center">
            <button
              onClick={handleCheckTests}
              disabled={isChecking || Object.keys(userAnswers).length !== generatedTests.questions.length}
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg shadow-md transition duration-200 flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isChecking ? (
                <>Sprawdzanie...</>
              ) : (
                <>
                  <Send className="mr-1" size={16} />
                  Sprawdź testy
                </>
              )}
            </button>

            {generatedTests.questions.some((q: TestQuestion) => q.isCorrect !== undefined) && ( // DODANE TYPY
              <div className="text-sm text-gray-600">
                Wynik: {generatedTests.questions.filter((q: TestQuestion) => q.isCorrect).length}/ {/* DODANE TYPY */}
                {generatedTests.questions.length} poprawnych odpowiedzi
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default TestsSection;