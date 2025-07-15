// frontend/src/components/AITutorModal.tsx
// This is the AI tutor that helps students understand business concepts
// Like having a patient teacher who explains things in simple terms

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
  Sparkles
} from 'lucide-react';
import { useGameStore } from '../store/GameStore';
import { useProgressStore } from '../store/progressStore';

interface AITutorModalProps {
  concept: string;
  isOpen: boolean;
  onClose: () => void;
  gameContext: {
    phase: string;
    playerCash: number;
    round: number;
  };
}

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

  // Reset state when modal opens with new concept
  useEffect(() => {
    if (isOpen) {
      setCurrentStep(0);
      setUserAnswers([]);
      setShowQuiz(false);
      setIsLoading(!aiTutoring); // Loading if no tutoring data yet
    }
  }, [isOpen, concept, aiTutoring]);

  // Handle quiz submission
  const handleQuizAnswer = (questionIndex: number, answer: string) => {
    const newAnswers = [...userAnswers];
    newAnswers[questionIndex] = answer;
    setUserAnswers(newAnswers);
  };

  // Submit quiz and record learning
  const handleSubmitQuiz = () => {
    if (!aiTutoring) return;
    
    // Simple scoring - in real implementation, you'd have correct answers
    const score = userAnswers.length / aiTutoring.followUpQuestions.length;
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
          className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden"
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
                  Let's learn about {concept.replace('-', ' ')}
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
                        Answer these questions to reinforce your learning
                      </p>
                    </div>

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
                        disabled={userAnswers.filter(a => a.trim()).length === 0}
                        className={`flex items-center gap-2 px-6 py-2 rounded-lg transition-colors ${
                          userAnswers.filter(a => a.trim()).length > 0
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
                      Great job learning about {concept.replace('-', ' ')}!
                    </h3>
                    <p className="text-gray-600 mb-6">
                      You've successfully completed this lesson. Your progress has been saved.
                    </p>
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
 * This AITutorModal component is like having a personal teacher who pops up
 * when you need help understanding business concepts. Here's how it works:
 * 
 * 1. STEP-BY-STEP LEARNING:
 *    - Step 1: Clear explanation of the business concept
 *    - Step 2: Interactive quiz to test understanding
 *    - Step 3: Completion celebration and progress tracking
 * 
 * 2. PERSONALIZED CONTENT:
 *    - Explanations tailored to the student's current game situation
 *    - Real-world examples to make concepts relatable
 *    - Specific tips for the current game phase
 * 
 * 3. INTERACTIVE FEATURES:
 *    - Multiple choice or text-based questions
 *    - Progress tracking for learning analytics
 *    - Ability to review lessons multiple times
 * 
 * 4. VISUAL DESIGN:
 *    - Clean, friendly interface that doesn't intimidate
 *    - Progress indicators to show learning journey
 *    - Color-coded sections for different types of information
 * 
 * 5. LEARNING REINFORCEMENT:
 *    - Quiz questions to check understanding
 *    - Progress saving for long-term tracking
 *    - Encouragement and positive feedback
 * 
 * KEY EDUCATIONAL FEATURES:
 * - Breaks complex topics into digestible pieces
 * - Uses context from the current game to make learning relevant
 * - Provides immediate feedback and encouragement
 * - Tracks learning progress for teachers and parents
 * 
 * This creates a supportive learning environment where students can get help
 * exactly when they need it, without feeling judged or rushed.
 */