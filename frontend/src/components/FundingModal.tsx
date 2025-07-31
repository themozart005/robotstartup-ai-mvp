// frontend/src/components/FundingModal.tsx
// Modal for selecting funding options in rounds 2+

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  DollarSign, 
  TrendingUp, 
  CreditCard,
  AlertTriangle,
  CheckCircle,
  X,
  Info,
  Building,
  Users,
  PieChart,
  Clock,
  HelpCircle
} from 'lucide-react';
import { Player } from '../store/GameStore';

interface FundingOption {
  type: 'equity' | 'debt' | 'skip';
  name: string;
  amount: number;
  equityGiven?: number;
  interestRate?: number;
  termRounds?: number;
  description: string;
}

interface FundingModalProps {
  isOpen: boolean;
  currentRound: number;
  player: Player;
  onSelectFunding: (option: FundingOption) => void;
  onRequestHelp: (concept: string) => void;
}

const FundingModal: React.FC<FundingModalProps> = ({
  isOpen,
  currentRound,
  player,
  onSelectFunding,
  onRequestHelp
}) => {
  const [selectedOption, setSelectedOption] = useState<FundingOption | null>(null);
  const [showDetails, setShowDetails] = useState(false);

  // Calculate current company valuation
  const calculateValuation = () => {
    const cash = player.cash || 0;
    const robotInventoryValue = player.robots.filter(r => !r.sold).length * 100000;
    const technologyValue = player.technologies.length * 50000;
    const totalAssets = cash + robotInventoryValue + technologyValue;
    const industryMultiple = 2.5; // Simplified for beginners
    
    return {
      cash,
      robotInventoryValue,
      technologyValue,
      totalAssets,
      valuation: totalAssets * industryMultiple
    };
  };

  const valuationData = calculateValuation();
  const currentEquity = player.equity || 100;

  // Define funding options based on round
  const fundingOptions: FundingOption[] = [
    {
      type: 'equity',
      name: 'Seed Extension',
      amount: 100000,
      equityGiven: 10,
      description: 'Early stage funding from angel investors'
    },
    {
      type: 'equity',
      name: 'Series A',
      amount: 250000,
      equityGiven: 20,
      description: 'Institutional funding for scaling operations'
    },
    {
      type: 'equity',
      name: 'Series B',
      amount: 500000,
      equityGiven: 30,
      description: 'Major funding round for rapid expansion'
    },
    {
      type: 'debt',
      name: 'SBA Business Loan',
      amount: 200000,
      interestRate: 0.08,
      termRounds: 5,
      description: 'Government-backed loan with fixed interest'
    },
    {
      type: 'skip',
      name: 'Bootstrap',
      amount: 0,
      description: 'Continue with current funds, no dilution or debt'
    }
  ];

  // Calculate post-funding equity
  const calculatePostFundingEquity = (option: FundingOption) => {
    if (option.type === 'equity' && option.equityGiven) {
      return currentEquity - option.equityGiven;
    }
    return currentEquity;
  };

  // Handle funding selection
  const handleConfirmFunding = () => {
    if (selectedOption) {
      onSelectFunding(selectedOption);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="bg-gray-900 rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden"
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-6 text-white">
            <div className="flex justify-between items-start">
              <div>
                <h2 className="text-2xl font-bold mb-2">Funding Round {currentRound}</h2>
                <p className="text-blue-100">Choose how to fund your company's growth</p>
              </div>
              <div className="text-right">
                <div className="text-sm text-blue-200">Current Equity</div>
                <div className="text-2xl font-bold">{currentEquity}%</div>
              </div>
            </div>
          </div>

          {/* Company Valuation */}
          <div className="bg-blue-500/20 border-b border-blue-500/30 p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Building className="text-blue-400" size={20} />
                <span className="text-white font-semibold">Company Valuation</span>
                <button
                  onClick={() => setShowDetails(!showDetails)}
                  className="ml-2 text-blue-400 hover:text-blue-300"
                >
                  <Info size={16} />
                </button>
              </div>
              <div className="text-2xl font-bold text-blue-400">
                ${valuationData.valuation.toLocaleString()}
              </div>
            </div>
            
            {showDetails && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                className="mt-3 pt-3 border-t border-blue-500/30 text-sm"
              >
                <div className="space-y-1 text-blue-100">
                  <div className="flex justify-between">
                    <span>Cash:</span>
                    <span>${valuationData.cash.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Robot Inventory:</span>
                    <span>${valuationData.robotInventoryValue.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Technology Assets:</span>
                    <span>${valuationData.technologyValue.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between font-semibold border-t border-blue-500/30 pt-1">
                    <span>Total Assets:</span>
                    <span>${valuationData.totalAssets.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-blue-300">
                    <span>Industry Multiple:</span>
                    <span>2.5x</span>
                  </div>
                </div>
              </motion.div>
            )}
          </div>

          {/* Funding Options */}
          <div className="p-6 space-y-4 max-h-[50vh] overflow-y-auto">
            {fundingOptions.map((option) => {
              const isSelected = selectedOption?.name === option.name;
              const postEquity = calculatePostFundingEquity(option);
              const willLoseControl = postEquity < 51 && option.type === 'equity';

              return (
                <motion.div
                  key={option.name}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setSelectedOption(option)}
                  className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                    isSelected
                      ? 'border-blue-500 bg-blue-500/20'
                      : 'border-gray-600 bg-white/5 hover:border-gray-500'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        {option.type === 'equity' && <TrendingUp className="text-green-400" size={24} />}
                        {option.type === 'debt' && <CreditCard className="text-orange-400" size={24} />}
                        {option.type === 'skip' && <CheckCircle className="text-gray-400" size={24} />}
                        
                        <div>
                          <h3 className="text-white font-semibold text-lg">{option.name}</h3>
                          <p className="text-gray-300 text-sm">{option.description}</p>
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-4 text-sm">
                        {option.amount > 0 && (
                          <div className="flex items-center gap-2">
                            <DollarSign className="text-green-400" size={16} />
                            <span className="text-green-100">
                              Receive: ${option.amount.toLocaleString()}
                            </span>
                          </div>
                        )}

                        {option.equityGiven && (
                          <div className="flex items-center gap-2">
                            <PieChart className="text-purple-400" size={16} />
                            <span className="text-purple-100">
                              Give up: {option.equityGiven}% equity
                            </span>
                          </div>
                        )}

                        {option.interestRate && (
                          <div className="flex items-center gap-2">
                            <TrendingUp className="text-orange-400" size={16} />
                            <span className="text-orange-100">
                              Interest: {(option.interestRate * 100).toFixed(0)}% total
                            </span>
                          </div>
                        )}

                        {option.termRounds && (
                          <div className="flex items-center gap-2">
                            <Clock className="text-blue-400" size={16} />
                            <span className="text-blue-100">
                              Term: {option.termRounds} rounds
                            </span>
                          </div>
                        )}
                      </div>

                      {option.type === 'equity' && (
                        <div className="mt-3 p-2 bg-gray-800 rounded">
                          <div className="flex justify-between items-center text-sm">
                            <span className="text-gray-400">Your equity after funding:</span>
                            <span className={`font-semibold ${
                              willLoseControl ? 'text-red-400' : 'text-green-400'
                            }`}>
                              {postEquity}%
                            </span>
                          </div>
                        </div>
                      )}

                      {willLoseControl && (
                        <div className="mt-2 p-2 bg-red-500/20 border border-red-500/30 rounded flex items-center gap-2">
                          <AlertTriangle className="text-red-400" size={16} />
                          <span className="text-red-200 text-sm">
                            Warning: You'll lose majority control of your company!
                          </span>
                        </div>
                      )}
                    </div>

                    {isSelected && (
                      <div className="ml-4">
                        <CheckCircle className="text-blue-400" size={24} />
                      </div>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>

          {/* Footer Actions */}
          <div className="border-t border-gray-700 p-6">
            <div className="flex justify-between items-center">
              <button
                onClick={() => onRequestHelp('venture-capital-vs-debt')}
                className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors"
              >
                <HelpCircle size={16} />
                Learn about Funding Options
              </button>

              <div className="flex gap-3">
                <button
                  onClick={handleConfirmFunding}
                  disabled={!selectedOption}
                  className={`px-6 py-2 rounded-lg font-semibold transition-all ${
                    selectedOption
                      ? 'bg-blue-600 hover:bg-blue-700 text-white'
                      : 'bg-gray-600 text-gray-400 cursor-not-allowed'
                  }`}
                >
                  Confirm Funding Choice
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default FundingModal;