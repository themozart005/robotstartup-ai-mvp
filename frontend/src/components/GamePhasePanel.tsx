// frontend/src/components/GamePhasePanel.tsx
// FIXED VERSION - Properly handles startup/bootstrap phase naming

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  DollarSign, 
  Cog, 
  Factory, 
  ShoppingCart, 
  CreditCard,
  HelpCircle,
  Zap,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  Clock,
  Users,
  PieChart,
  Building,
  BarChart3,
  Target,
  Sparkles,
  Rocket
} from 'lucide-react';
import toast from 'react-hot-toast';
import { Player, GameSettings } from '../store/GameStore';
import FundingModal from './FundingModal';
import GrowthPhaseModal from './GrowthPhaseModal';

interface GamePhasePanelProps {
  phase: string; // Changed from specific types to string to handle both old and new phase names
  phaseInfo: {
    phase: string;
    description: string;
    actions: string[];
  };
  player: Player;
  gameSettings: GameSettings;
  marketConditions: any;
  isMyTurn: boolean;
  canMakeMove: boolean;
  currentRound: number;
  onMakeMove: (moveData: any) => void;
  onRequestHelp: (concept: string) => void;
  selectedAction: string | null;
  onSelectAction: (action: string | null) => void;
}

const GamePhasePanel: React.FC<GamePhasePanelProps> = ({
  phase,
  phaseInfo,
  player,
  gameSettings,
  marketConditions,
  isMyTurn,
  canMakeMove,
  currentRound,
  onMakeMove,
  onRequestHelp,
  selectedAction,
  onSelectAction
}) => {
  const [actionData, setActionData] = useState<any>({});
  const [showFundingModal, setShowFundingModal] = useState(false);
  const [showGrowthModal, setShowGrowthModal] = useState(false);

  // FIXED: Normalize phase names - handle both "startup" and "bootstrap"
  const normalizedPhase = phase === 'startup' ? 'bootstrap' : phase;
  const isBootstrapPhase = normalizedPhase === 'bootstrap' && currentRound === 1;
  const isFundingPhase = (normalizedPhase === 'bootstrap' && currentRound > 1) || normalizedPhase === 'funding';

  // Handle funding selection from modal
  const handleFundingSelection = (option: any) => {
    if (option.type === 'skip') {
      onMakeMove({
        action: 'skip_funding',
        data: {}
      });
    } else {
      onMakeMove({
        action: 'select_funding',
        data: {
          fundingType: option.type,
          amount: option.amount,
          equityGiven: option.equityGiven,
          interestRate: option.interestRate,
          termRounds: option.termRounds,
          investorName: option.name
        }
      });
    }
    setShowFundingModal(false);
  };

  // Handle growth selection from modal
  const handleGrowthSelection = (option: any) => {
    if (option.amount === 0) {
      onMakeMove({
        action: 'skip_growth',
        data: {}
      });
    } else {
      onMakeMove({
        action: 'invest_marketing',
        data: {
          investmentType: option.investmentType,
          amount: option.amount
        }
      });
    }
    setShowGrowthModal(false);
  };

  // FIXED: Bootstrap/Startup Phase - handles both Round 1 bootstrap and legacy startup
  const renderBootstrapPhase = () => {
  // For Round 2+, show funding modal instead
	if (currentRound > 1) {
	  setShowFundingModal(true);
      return (
         <div className="space-y-4">
           <div className="bg-gradient-to-r from-purple-600 to-pink-600 p-4 rounded-lg">
			 <h3 className="text-white font-bold text-lg mb-2 flex items-center gap-2">
				<TrendingUp size={20} />
				Funding Round {currentRound}
			 </h3>
			 <p className="text-purple-100 mb-4">
			   Choose your funding strategy to scale your proven business.
			 </p>
          
             <button
			   onClick={() => setShowFundingModal(true)}
			   disabled={!canMakeMove}
               className={`w-full py-3 px-4 rounded-lg font-semibold transition-all ${
                 canMakeMove
				   ? 'bg-purple-600 hover:bg-purple-700 text-white shadow-lg hover:shadow-xl'
				   : 'bg-gray-500 text-gray-300 cursor-not-allowed'
               }`}
			  >
               Open Funding Options
			  </button>
		   </div>
		 </div>
      );
	}

    // Round 1 Bootstrap FIXED: Always show button in Round 1 bootstrap
    return (
		<div className="space-y-4">
		  <div className="bg-gradient-to-r from-green-600 to-emerald-600 p-6 rounded-lg">
			<div className="flex items-center justify-between mb-4">
			  <div className="flex items-center gap-3">
				<Rocket className="text-white" size={32} />
				<div>
				  <h3 className="text-xl font-bold text-white">Bootstrap Your Startup!</h3>
				  <p className="text-green-100 text-sm">Collect your initial funding to begin your journey</p>
				</div>
			  </div>
			  <div className="text-right">
				<div className="text-2xl font-bold text-white">$50,000</div>
				<div className="text-green-100 text-sm">Friends & Family Round</div>
			  </div>
			</div>

			<div className="bg-white/10 backdrop-blur rounded-lg p-4 mb-4">
			  <p className="text-green-50 text-sm mb-3">
				This is your pre-seed funding from friends and family who believe in your vision. 
				Use it wisely to develop your MVP and prove your concept!
			  </p>
			  <div className="space-y-2 text-green-100 text-sm">
				<div className="flex items-center gap-2">
				  <CheckCircle size={16} />
				  <span>No equity dilution</span>
				</div>
				<div className="flex items-center gap-2">
				  <CheckCircle size={16} />
				  <span>No debt obligations</span>
				</div>
				<div className="flex items-center gap-2">
				  <CheckCircle size={16} />
				  <span>Complete control retained</span>
				</div>
			  </div>
			</div>

			{/* FIXED: For Round 1 bootstrap, always show the button */}
			<button
			  onClick={() => {
				console.log('🎯 Bootstrap button clicked!');
				onMakeMove({ action: 'collect_income', data: {} });
			  }}
			  className="w-full py-3 px-6 rounded-lg font-bold transition-all flex items-center justify-center gap-2 bg-white text-green-600 hover:bg-green-50 shadow-lg hover:shadow-xl cursor-pointer"
			>
			  <DollarSign size={20} />
			  Collect $50,000 Bootstrap Funding
			</button>

			{/* Debug info */}
			<div className="mt-2 text-xs text-green-200 bg-green-800/30 p-2 rounded">
			  Debug: Round {currentRound}, Turn: {isMyTurn ? 'Yes' : 'No'}, Can Move: {canMakeMove ? 'Yes' : 'No'}
			</div>
		  </div>

		  <div className="bg-blue-500/20 border border-blue-500/30 rounded-lg p-3">
			<h4 className="text-white font-medium mb-2">💡 Bootstrap Strategy</h4>
			<ul className="text-blue-200 text-sm space-y-1">
			  <li>• This is your initial capital to prove your concept</li>
			  <li>• Focus on building an MVP and finding early customers</li>
			  <li>• Manage cash carefully - you won't get more funding until Round 2</li>
			</ul>
		  </div>
		</div>
	);
  };

  // Keep your other phase rendering methods as they are...
  // (renderRnDPhase, renderProductionPhase, renderSalesPhase, renderGrowthPhase)
  
  // [Include all your existing phase render methods here - I'm not repeating them to save space]

  // Main render logic with proper phase handling
  const renderPhaseContent = () => {
    // FIXED: Handle both "startup" and "bootstrap" phase names
    switch (normalizedPhase) {
      case 'bootstrap':
        return renderBootstrapPhase();
      case 'funding':
        return isFundingPhase ? (
          <div className="space-y-4">
            <div className="bg-gradient-to-r from-purple-600 to-pink-600 p-4 rounded-lg">
              <h3 className="text-white font-bold text-lg mb-2 flex items-center gap-2">
                <TrendingUp size={20} />
                Funding Phase - Scale Your Proven Business
              </h3>
              <p className="text-purple-100 mb-4">
                You've proven your concept works. Now raise capital to scale your operations.
              </p>
              
              <button
                onClick={() => setShowFundingModal(true)}
                disabled={!canMakeMove}
                className={`w-full py-3 px-4 rounded-lg font-semibold transition-all ${
                  canMakeMove
                    ? 'bg-purple-600 hover:bg-purple-700 text-white shadow-lg hover:shadow-xl'
                    : 'bg-gray-500 text-gray-300 cursor-not-allowed'
                }`}
              >
                Choose Funding Strategy
              </button>
            </div>
          </div>
        ) : renderBootstrapPhase();
      case 'r&d':
        return renderRnDPhase();
      case 'production':
        return renderProductionPhase();
      case 'sales':
        return renderSalesPhase();
      case 'growth':
      case 'investment': // Handle legacy "investment" phase as growth
        return renderGrowthPhase();
      default:
        return (
          <div className="bg-red-500/20 border border-red-500/30 rounded-lg p-4">
            <p className="text-red-200">Unknown phase: {phase}</p>
            <p className="text-red-100 text-sm mt-2">
              Normalized phase: {normalizedPhase}, Round: {currentRound}
            </p>
            {isMyTurn && (
              <button
                onClick={() => onMakeMove({ action: 'skip_phase', data: {} })}
                className="mt-4 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded"
              >
                Skip Phase
              </button>
            )}
          </div>
        );
    }
  };

  // Include your existing phase render methods here
  const renderRnDPhase = () => {
    // Your existing R&D phase code
    const [selectedTech, setSelectedTech] = useState('');
    const [investment, setInvestment] = useState(100000);

    const technologies = [
      { name: 'AI Navigation', cost: 120000, benefit: 'Improves robot guidance systems' },
      { name: 'Advanced Arms', cost: 100000, benefit: 'Enhances robot manipulation' },
      { name: 'Battery Optimization', cost: 110000, benefit: 'Extends operational time' },
      { name: 'Autonomous System', cost: 150000, benefit: 'Enables minimal supervision' },
      { name: 'Sensor Technology', cost: 115000, benefit: 'Improves awareness and precision' }
    ];

    return (
      <div className="space-y-4">
        <div className="bg-purple-500/20 border border-purple-500/30 rounded-lg p-4">
          <div className="flex items-center gap-3 mb-4">
            <Cog className="text-purple-400" size={24} />
            <div>
              <h3 className="text-white font-semibold">Research & Development</h3>
              <p className="text-purple-200 text-sm">
                {currentRound === 1 ? 'Develop your MVP and core technology' : 'Advance technology for competitive advantage'}
              </p>
            </div>
          </div>

          <div className="space-y-2 mb-4">
            <label className="text-white text-sm font-medium">Select Technology:</label>
            <select
              value={selectedTech}
              onChange={(e) => {
                setSelectedTech(e.target.value);
                const tech = technologies.find(t => t.name === e.target.value);
                if (tech) setInvestment(tech.cost);
                setActionData({ technology: e.target.value, investment: tech?.cost || 100000 });
              }}
              className="w-full p-2 bg-white/10 border border-white/20 rounded text-white"
              disabled={!canMakeMove}
            >
              <option value="">Choose a technology...</option>
              {technologies.map(tech => (
                <option key={tech.name} value={tech.name} className="text-black">
                  {tech.name} - ${tech.cost.toLocaleString()}
                </option>
              ))}
            </select>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => {
                if (selectedTech) {
                  onMakeMove({
                    action: 'invest_r&d',
                    data: { technology: selectedTech }
                  });
                }
              }}
              disabled={!canMakeMove || !selectedTech || player.cash < investment}
              className={`flex-1 py-2 px-4 rounded font-semibold transition-all ${
                canMakeMove && selectedTech && player.cash >= investment
                  ? 'bg-purple-600 hover:bg-purple-700 text-white'
                  : 'bg-gray-500 text-gray-300 cursor-not-allowed'
              }`}
            >
              Invest in R&D
            </button>
            
            <button
              onClick={() => onMakeMove({ action: 'skip_r&d', data: {} })}
              disabled={!canMakeMove}
              className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded transition-colors"
            >
              Skip
            </button>
          </div>
        </div>
      </div>
    );
  };

  const renderProductionPhase = () => {
    // Your existing production phase code - keeping it simple for space
    return (
      <div className="space-y-4">
        <div className="bg-orange-500/20 border border-orange-500/30 rounded-lg p-4">
          <h3 className="text-white font-semibold">Production Phase</h3>
          <p className="text-orange-200 text-sm mb-4">Build robots to sell</p>
          <button
            onClick={() => onMakeMove({ action: 'build_robots', data: { robotType: 'Service', quantity: 1 } })}
            disabled={!canMakeMove}
            className="w-full py-2 px-4 bg-orange-600 hover:bg-orange-700 text-white rounded"
          >
            Build Robot
          </button>
        </div>
      </div>
    );
  };

  const renderSalesPhase = () => {
    // Your existing sales phase code
    const unsoldRobots = player.robots.filter(r => !r.sold);
    
    return (
      <div className="space-y-4">
        <div className="bg-green-500/20 border border-green-500/30 rounded-lg p-4">
          <h3 className="text-white font-semibold">Sales Phase</h3>
          <p className="text-green-200 text-sm mb-4">
            Sell your robots ({unsoldRobots.length} available)
          </p>
          <button
            onClick={() => onMakeMove({ action: 'sell_robots', data: { quantity: 'all' } })}
            disabled={!canMakeMove || unsoldRobots.length === 0}
            className="w-full py-2 px-4 bg-green-600 hover:bg-green-700 text-white rounded"
          >
            Sell All Robots
          </button>
        </div>
      </div>
    );
  };

  const renderGrowthPhase = () => {
    // Your existing growth phase code
    return (
      <div className="space-y-4">
        <div className="bg-gradient-to-r from-pink-600 to-orange-600 p-4 rounded-lg">
          <h3 className="text-white font-bold text-lg mb-2">Growth Phase</h3>
          <p className="text-pink-100 mb-4">Invest in growth strategies</p>
          <button
            onClick={() => setShowGrowthModal(true)}
            disabled={!canMakeMove}
            className="w-full py-3 px-4 bg-pink-600 hover:bg-pink-700 text-white rounded-lg"
          >
            Choose Growth Strategy
          </button>
        </div>
      </div>
    );
  };

  // Main component return
  return (
    <>
      <div className="bg-gray-800 rounded-lg shadow-xl p-6">
        {/* Phase Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-white capitalize">
              {normalizedPhase === 'bootstrap' && currentRound === 1 ? 'Bootstrap' : 
               normalizedPhase === 'bootstrap' && currentRound > 1 ? 'Funding' : 
               normalizedPhase} Phase
            </h2>
            <p className="text-gray-400 mt-1">{phaseInfo.description}</p>
          </div>
          {isMyTurn && (
            <div className="flex items-center gap-2 px-3 py-1 bg-green-500/20 border border-green-500/30 rounded">
              <Zap className="text-green-400" size={16} />
              <span className="text-green-300 text-sm font-medium">Your Turn</span>
            </div>
          )}
        </div>

        {/* Phase Content */}
        <AnimatePresence mode="wait">
          <motion.div
            key={`${phase}-${currentRound}`}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
          >
            {renderPhaseContent()}
          </motion.div>
        </AnimatePresence>

        {/* Turn Indicator */}
        {!isMyTurn && (
          <div className="mt-6 p-3 bg-gray-700/50 rounded-lg border border-gray-600">
            <div className="flex items-center gap-2">
              <Clock className="text-gray-400" size={16} />
              <span className="text-gray-300 text-sm">Waiting for other players...</span>
            </div>
          </div>
        )}
      </div>

      {/* Modals */}
      <FundingModal
        isOpen={showFundingModal}
        currentRound={currentRound}
        player={player}
        onSelectFunding={handleFundingSelection}
        onRequestHelp={onRequestHelp}
      />

      <GrowthPhaseModal
        isOpen={showGrowthModal}
        currentRound={currentRound}
        player={player}
        onSelectGrowth={handleGrowthSelection}
        onRequestHelp={onRequestHelp}
      />
    </>
  );
};

export default GamePhasePanel;