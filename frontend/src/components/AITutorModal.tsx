// frontend/src/components/AITutorModal.tsx
// ENHANCED VERSION - With visual funding education and interactive examples

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, 
  Brain, 
  MessageCircle, 
  Lightbulb, 
  BookOpen, 
  HelpCircle,
  CheckCircle,
  ArrowRight,
  Sparkles,
  PieChart,
  TrendingUp,
  DollarSign,
  Calculator,
  AlertTriangle,
  Users
} from 'lucide-react';
import { useGameStore } from '../store/GameStore';
import { useProgressStore } from '../store/ProgressStore';

interface AITutorModalProps {
  concept: string;
  isOpen: boolean;
  onClose: () => void;
  gameContext: {
    phase: string;
    playerCash: number;
    round: number;
    robotCount?: number;
    techCount?: number;
    equity?: number;
    fundingHistory?: any[];
    companyValuation?: number;
  };
}

// Visual component for equity dilution
const EquityVisualizer: React.FC<{ currentEquity: number; scenario?: { give: number; newEquity: number } }> = ({ 
  currentEquity, 
  scenario 
}) => {
  const segments = 10;
  const filledSegments = Math.floor((currentEquity / 100) * segments);
  const scenarioSegments = scenario ? Math.floor((scenario.newEquity / 100) * segments) : 0;

  return (
    <div className="bg-gray-100 rounded-lg p-4">
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm font-medium text-gray-700">Your Company Ownership</span>
        <span className="text-lg font-bold text-blue-600">{currentEquity}%</span>
      </div>
      
      <div className="grid grid-cols-10 gap-1 mb-3">
        {Array.from({ length: segments }).map((_, i) => (
          <div
            key={i}
            className={`h-8 rounded transition-all ${
              i < filledSegments
                ? currentEquity >= 51 ? 'bg-green-500' : 'bg-orange-500'
                : 'bg-gray-300'
            }`}
          />
        ))}
      </div>

      {currentEquity >= 51 && (
        <div className="text-xs text-green-600 flex items-center gap-1">
          <CheckCircle size={12} />
          You have majority control
        </div>
      )}

      {scenario && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-4 pt-4 border-t border-gray-300"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-600">After giving {scenario.give}% equity:</span>
            <span className={`text-lg font-bold ${scenario.newEquity >= 51 ? 'text-green-600' : 'text-red-600'}`}>
              {scenario.newEquity}%
            </span>
          </div>
          <div className="grid grid-cols-10 gap-1">
            {Array.from({ length: segments }).map((_, i) => (
              <div
                key={i}
                className={`h-8 rounded transition-all ${
                  i < scenarioSegments
                    ? scenario.newEquity >= 51 ? 'bg-green-400' : 'bg-red-400'
                    : 'bg-gray-300'
                }`}
              />
            ))}
          </div>
          {scenario.newEquity < 51 && (
            <div className="text-xs text-red-600 flex items-center gap-1 mt-2">
              <AlertTriangle size={12} />
              You would lose majority control!
            </div>
          )}
        </motion.div>
      )}
    </div>
  );
};

// Funding comparison component
const FundingComparison: React.FC<{ cash: number }> = ({ cash }) => {
  const [selectedAmount, setSelectedAmount] = useState(250000);

  const equityOption = {
    amount: selectedAmount,
    equityGiven: selectedAmount === 100000 ? 10 : selectedAmount === 250000 ? 20 : 30,
    pros: ['No repayment needed', 'Investor expertise', 'Network access'],
    cons: ['Lose ownership %', 'Less control', 'Investor pressure']
  };

  const debtOption = {
    amount: selectedAmount,
    interest: selectedAmount * 0.08,
    totalPayback: selectedAmount * 1.08,
    monthlyPayment: (selectedAmount * 1.08) / 5,
    pros: ['Keep 100% ownership', 'Tax deductible interest', 'Clear repayment terms'],
    cons: ['Must repay with interest', 'Cash flow pressure', 'Default risk']
  };

  return (
    <div className="space-y-4">
      <div className="bg-gray-100 rounded-lg p-3">
        <label className="text-sm font-medium text-gray-700 mb-2 block">
          How much funding do you need?
        </label>
        <div className="flex gap-2">
          {[100000, 250000, 500000].map(amount => (
            <button
              key={amount}
              onClick={() => setSelectedAmount(amount)}
              className={`px-3 py-2 rounded transition-all ${
                selectedAmount === amount
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-200'
              }`}
            >
              ${(amount / 1000)}K
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Equity Option */}
        <div className="bg-purple-50 rounded-lg p-4 border-2 border-purple-200">
          <div className="flex items-center gap-2 mb-3">
            <Users className="text-purple-600" size={20} />
            <h4 className="font-semibold text-purple-900">Venture Capital</h4>
          </div>
          
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">You receive:</span>
              <span className="font-semibold text-purple-700">${selectedAmount.toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">You give up:</span>
              <span className="font-semibold text-red-600">{equityOption.equityGiven}% equity</span>
            </div>
            
            <div className="pt-2 mt-2 border-t border-purple-200">
              <div className="text-green-700 text-xs">
                <strong>Pros:</strong>
                {equityOption.pros.map((pro, i) => (
                  <div key={i}>• {pro}</div>
                ))}
              </div>
              <div className="text-red-700 text-xs mt-2">
                <strong>Cons:</strong>
                {equityOption.cons.map((con, i) => (
                  <div key={i}>• {con}</div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Debt Option */}
        <div className="bg-orange-50 rounded-lg p-4 border-2 border-orange-200">
          <div className="flex items-center gap-2 mb-3">
            <DollarSign className="text-orange-600" size={20} />
            <h4 className="font-semibold text-orange-900">Business Loan</h4>
          </div>
          
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">You receive:</span>
              <span className="font-semibold text-orange-700">${selectedAmount.toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Total payback:</span>
              <span className="font-semibold text-red-600">${debtOption.totalPayback.toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Per round:</span>
              <span className="text-orange-700">${debtOption.monthlyPayment.toLocaleString()}</span>
            </div>
            
            <div className="pt-2 mt-2 border-t border-orange-200">
              <div className="text-green-700 text-xs">
                <strong>Pros:</strong>
                {debtOption.pros.map((pro, i) => (
                  <div key={i}>• {pro}</div>
                ))}
              </div>
              <div className="text-red-700 text-xs mt-2">
                <strong>Cons:</strong>
                {debtOption.cons.map((con, i) => (
                  <div key={i}>• {con}</div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Interactive calculation exercise
const CalculationExercise: React.FC<{ 
  type: 'equity' | 'loan'; 
  onComplete: (correct: boolean) => void 
}> = ({ type, onComplete }) => {
  const [userAnswer, setUserAnswer] = useState('');
  const [showResult, setShowResult] = useState(false);

  const exercise = type === 'equity' ? {
    question: "You currently own 80% of your company. If you give up 20% equity for funding, what percentage will you own?",
    correctAnswer: 60,
    explanation: "80% - 20% = 60%. You'll still have majority control (over 50%)."
  } : {
    question: "You take a $100,000 loan at 10% interest for 5 rounds. What's your total payback amount?",
    correctAnswer: 110000,
    explanation: "$100,000 + (10% × $100,000) = $100,000 + $10,000 = $110,000"
  };

  const checkAnswer = () => {
    const isCorrect = parseInt(userAnswer) === exercise.correctAnswer;
    setShowResult(true);
    onComplete(isCorrect);
  };

  return (
    <div className="bg-blue-50 rounded-lg p-4">
      <div className="flex items-center gap-2 mb-3">
        <Calculator className="text-blue-600" size={20} />
        <h4 className="font-semibold text-blue-900">Quick Calculation</h4>
      </div>

      <p className="text-sm text-gray-700 mb-3">{exercise.question}</p>

      <div className="flex gap-2 mb-3">
        <input
          type="number"
          value={userAnswer}
          onChange={(e) => setUserAnswer(e.target.value)}
          placeholder="Enter your answer"
          className="flex-1 px-3 py-2 border border-gray-300 rounded focus:border-blue-500 focus:outline-none"
          disabled={showResult}
        />
        {!showResult && (
          <button
            onClick={checkAnswer}
            disabled={!userAnswer}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-300"
          >
            Check
          </button>
        )}
      </div>

      {showResult && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className={`p-3 rounded ${
            parseInt(userAnswer) === exercise.correctAnswer
              ? 'bg-green-100 text-green-800'
              : 'bg-red-100 text-red-800'
          }`}
        >
          <div className="font-semibold mb-1">
            {parseInt(userAnswer) === exercise.correctAnswer ? '✅ Correct!' : '❌ Not quite right'}
          </div>
          <div className="text-sm">{exercise.explanation}</div>
        </motion.div>
      )}
    </div>
  );
};

const AITutorModal: React.FC<AITutorModalProps> = ({
  concept,
  isOpen,
  onClose,
  gameContext
}) => {
  const { aiTutoring } = useGameStore();
  const { recordConceptPractice } = useProgressStore();
  
  const [isLoading, setIsLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [userAnswers, setUserAnswers] = useState<string[]>([]);
  const [showQuiz, setShowQuiz] = useState(false);
  const [quizScore, setQuizScore] = useState(0);

  // Determine if this is a funding-related concept
  const isFundingConcept = [
    'venture-capital-vs-debt',
    'equity-dilution',
    'debt-financing',
    'funding-strategy'
  ].includes(concept);

  // Reset state when modal opens with new concept
  useEffect(() => {
    if (isOpen) {
      setCurrentStep(0);
      setUserAnswers([]);
      setShowQuiz(false);
      setQuizScore(0);
      setIsLoading(!aiTutoring);
    }
  }, [isOpen, concept, aiTutoring]);

  // Handle quiz submission
  const handleQuizAnswer = (questionIndex: number, answer: string) => {
    const newAnswers = [...userAnswers];
    newAnswers[questionIndex] = answer;
    setUserAnswers(newAnswers);
  };

  // Handle calculation exercise completion
  const handleCalculationComplete = (correct: boolean) => {
    if (correct) {
      setQuizScore(quizScore + 1);
    }
    recordConceptPractice(concept, correct, 'Calculation Exercise');
  };

  // Submit quiz and record learning
  const handleSubmitQuiz = () => {
    if (!aiTutoring) return;
    
    const score = userAnswers.filter(a => a.trim().length > 20).length / aiTutoring.followUpQuestions.length;
    recordConceptPractice(concept, score > 0.6, 'AI Tutor Quiz');
    
    setShowQuiz(false);
    setCurrentStep(currentStep + 1);
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
        onClick={(e) => e.target === e.currentTarget && onClose()}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="bg-white rounded-xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-hidden"
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-purple-600 to-blue-600 p-6 text-white relative">
            <button
              onClick={onClose}
              className="absolute top-4 right-4 p-2 hover:bg-white/20 rounded-full transition-colors"
            >
              <X size={20} />
            </button>
            
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-white/20 rounded-lg">
                <Brain className="text-white" size={24} />
              </div>
              <div>
                <h2 className="text-xl font-bold">AI Business Tutor</h2>
                <p className="text-purple-100 text-sm">
                  Let's learn about {concept.replace(/-/g, ' ')}
                </p>
              </div>
            </div>
            
            {/* Progress Indicator */}
            <div className="flex items-center gap-2 mt-4">
              {[0, 1, 2].map((step) => (
                <div
                  key={step}
                  className={`h-2 flex-1 rounded-full transition-all ${
                    step <= currentStep ? 'bg-white' : 'bg-white/30'
                  }`}
                />
              ))}
            </div>
          </div>

          {/* Content */}
          <div className="p-6 overflow-y-auto max-h-[60vh]">
            {isLoading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
                <p className="text-gray-600">AI tutor is preparing your lesson...</p>
              </div>
            ) : aiTutoring ? (
              <AnimatePresence mode="wait">
                {currentStep === 0 && (
                  <motion.div
                    key="explanation"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="space-y-6"
                  >
                    {/* Main Explanation */}
                    <div className="bg-blue-50 rounded-lg p-4">
                      <div className="flex items-center gap-2 mb-3">
                        <BookOpen className="text-blue-600" size={20} />
                        <h3 className="font-semibold text-blue-900">What is this concept?</h3>
                      </div>
                      <p className="text-gray-700 leading-relaxed">
                        {aiTutoring.explanation}
                      </p>
                    </div>

                    {/* Visual Component for Funding Concepts */}
                    {isFundingConcept && gameContext.equity && (
                      <div className="bg-purple-50 rounded-lg p-4">
                        <div className="flex items-center gap-2 mb-3">
                          <PieChart className="text-purple-600" size={20} />
                          <h3 className="font-semibold text-purple-900">Your Current Situation</h3>
                        </div>
                        {concept === 'equity-dilution' && (
                          <EquityVisualizer 
                            currentEquity={gameContext.equity} 
                            scenario={{ give: 20, newEquity: gameContext.equity - 20 }}
                          />
                        )}
                        {concept === 'venture-capital-vs-debt' && (
                          <FundingComparison cash={gameContext.playerCash} />
                        )}
                      </div>
                    )}

                    {/* Real-world Example */}
                    <div className="bg-green-50 rounded-lg p-4">
                      <div className="flex items-center gap-2 mb-3">
                        <Lightbulb className="text-green-600" size={20} />
                        <h3 className="font-semibold text-green-900">Real-world Example</h3>
                      </div>
                      <p className="text-gray-700 leading-relaxed">
                        {aiTutoring.example}
                      </p>
                    </div>

                    {/* Game Application */}
                    <div className="bg-purple-50 rounded-lg p-4">
                      <div className="flex items-center gap-2 mb-3">
                        <Sparkles className="text-purple-600" size={20} />
                        <h3 className="font-semibold text-purple-900">How this applies to your game</h3>
                      </div>
                      <p className="text-gray-700 leading-relaxed">
                        {aiTutoring.gameApplication}
                      </p>
                      
                      {/* Show specific game stats */}
                      <div className="mt-3 p-3 bg-purple-100 rounded text-sm">
                        <div className="grid grid-cols-2 gap-2 text-purple-800">
                          <div>Current Cash: ${gameContext.playerCash.toLocaleString()}</div>
                          <div>Round: {gameContext.round}</div>
                          {gameContext.equity && <div>Your Equity: {gameContext.equity}%</div>}
                          {gameContext.companyValuation && (
                            <div>Valuation: ${gameContext.companyValuation.toLocaleString()}</div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Context-specific tip */}
                    <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <HelpCircle className="text-yellow-600" size={18} />
                        <span className="font-medium text-yellow-900">Tip for this situation</span>
                      </div>
                      <p className="text-yellow-800 text-sm">
                        {aiTutoring.tip}
                      </p>
                    </div>

                    <div className="flex justify-between items-center pt-4">
                      <button
                        onClick={onClose}
                        className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
                      >
                        Got it, thanks!
                      </button>
                      <button
                        onClick={() => setCurrentStep(1)}
                        className="flex items-center gap-2 px-6 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors"
                      >
                        Test My Understanding
                        <ArrowRight size={16} />
                      </button>
                    </div>
                  </motion.div>
                )}

                {currentStep === 1 && (
                  <motion.div
                    key="quiz"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="space-y-6"
                  >
                    <div className="text-center mb-6">
                      <MessageCircle className="text-purple-600 mx-auto mb-2" size={32} />
                      <h3 className="text-lg font-semibold text-gray-900">Quick Understanding Check</h3>
                      <p className="text-gray-600 text-sm">
                        {isFundingConcept ? 'Complete the exercise and answer questions' : 'Answer these questions to reinforce your learning'}
                      </p>
                    </div>

                    {/* Interactive calculation for funding concepts */}
                    {isFundingConcept && (
                      <CalculationExercise 
                        type={concept.includes('equity') ? 'equity' : 'loan'}
                        onComplete={handleCalculationComplete}
                      />
                    )}

                    {/* Follow-up questions */}
                    {aiTutoring.followUpQuestions.map((question, index) => (
                      <div key={index} className="bg-gray-50 rounded-lg p-4">
                        <label className="block font-medium text-gray-900 mb-3">
                          {index + 1}. {question}
                        </label>
                        <textarea
                          value={userAnswers[index] || ''}
                          onChange={(e) => handleQuizAnswer(index, e.target.value)}
                          placeholder="Type your answer here..."
                          className="w-full p-3 border border-gray-300 rounded-lg focus:border-purple-500 focus:outline-none resize-none"
                          rows={3}
                        />
                      </div>
                    ))}

                    <div className="flex justify-between items-center pt-4">
                      <button
                        onClick={() => setCurrentStep(0)}
                        className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
                      >
                        Back to Lesson
                      </button>
                      <button
                        onClick={handleSubmitQuiz}
                        disabled={userAnswers.filter(a => a?.trim()).length === 0}
                        className={`flex items-center gap-2 px-6 py-2 rounded-lg transition-colors ${
                          userAnswers.filter(a => a?.trim()).length > 0
                            ? 'bg-green-600 hover:bg-green-700 text-white'
                            : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                        }`}
                      >
                        <CheckCircle size={16} />
                        Submit Answers
                      </button>
                    </div>
                  </motion.div>
                )}

                {currentStep === 2 && (
                  <motion.div
                    key="completion"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="text-center py-8"
                  >
                    <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <CheckCircle className="text-green-600" size={32} />
                    </div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">
                      Great job learning about {concept.replace(/-/g, ' ')}!
                    </h3>
                    <p className="text-gray-600 mb-6">
                      You've successfully completed this lesson. Your progress has been saved.
                    </p>
                    
                    {/* Show score for calculation exercises */}
                    {isFundingConcept && quizScore > 0 && (
                      <div className="bg-blue-50 rounded-lg p-4 mb-6 max-w-sm mx-auto">
                        <div className="text-3xl font-bold text-blue-600">{quizScore}/1</div>
                        <div className="text-sm text-blue-700">Calculation Score</div>
                      </div>
                    )}
                    
                    <div className="flex gap-3 justify-center">
                      <button
                        onClick={() => setCurrentStep(0)}
                        className="px-4 py-2 bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 transition-colors"
                      >
                        Review Lesson
                      </button>
                      <button
                        onClick={onClose}
                        className="px-6 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors"
                      >
                        Back to Game
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            ) : (
              <div className="text-center py-8">
                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <X className="text-red-600" size={32} />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  AI Tutor Unavailable
                </h3>
                <p className="text-gray-600 mb-4">
                  The AI tutor is temporarily unavailable. Please try again in a moment.
                </p>
                <button
                  onClick={onClose}
                  className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors"
                >
                  Close
                </button>
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default AITutorModal;

/**
 * EXPLANATION FOR BEGINNERS:
 * 
 * This enhanced AITutorModal component is like having a smart, interactive teacher 
 * that adapts to different types of business concepts. Here's what's new:
 * 
 * 1. VISUAL LEARNING COMPONENTS:
 *    - Equity visualizer shows ownership percentages with colored bars
 *    - Funding comparison displays pros/cons of equity vs debt side-by-side
 *    - Interactive elements help students see immediate impact of decisions
 * 
 * 2. INTERACTIVE EXERCISES:
 *    - Calculation problems for equity dilution and loan interest
 *    - Immediate feedback on answers
 *    - Score tracking for gamification
 * 
 * 3. ENHANCED GAME CONTEXT:
 *    - Shows current equity position
 *    - Displays company valuation
 *    - Tracks funding history
 *    - Relates everything to student's current game situation
 * 
 * 4. FUNDING-SPECIFIC FEATURES:
 *    - Special handling for venture capital concepts
 *    - Equity dilution warnings and visualizations
 *    - Loan repayment calculations
 *    - Control threshold alerts (51% ownership)
 * 
 * 5. IMPROVED LEARNING FLOW:
 *    - Step 1: Visual explanation with real examples
 *    - Step 2: Interactive exercises and questions
 *    - Step 3: Completion with score display
 * 
 * KEY EDUCATIONAL ENHANCEMENTS:
 * - Visual learners benefit from charts and graphics
 * - Kinesthetic learners engage with interactive exercises
 * - Immediate application to their game situation
 * - Real-world business examples remain prominent
 * - Progressive difficulty based on concept complexity
 * 
 * This creates a more engaging and effective learning experience, especially
 * for complex financial concepts that are often abstract for young students.
 */