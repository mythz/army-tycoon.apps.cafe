
import React from 'react';
import { Rank } from '../types';
import { RankIcon } from './icons';

interface RankUpModalProps {
  newRank: Rank;
  onClose: () => void;
}

const RankUpModal: React.FC<RankUpModalProps> = ({ newRank, onClose }) => {
  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-base-200 border border-secondary rounded-xl shadow-2xl p-8 text-center max-w-sm w-full transform transition-all animate-jump-in">
        <div className="mx-auto bg-secondary/80 rounded-full w-20 h-20 flex items-center justify-center mb-4 border-4 border-secondary">
          <RankIcon className="w-12 h-12 text-white" />
        </div>
        <h2 className="text-2xl sm:text-3xl font-black text-secondary uppercase tracking-wider mb-2">Promotion!</h2>
        <p className="text-gray-300 mb-1">You have been promoted to</p>
        <p className="text-xl sm:text-2xl font-bold text-white mb-6">{newRank.name}</p>
        <button
          onClick={onClose}
          className="w-full bg-primary text-white font-bold py-2 px-4 rounded-lg transition-colors hover:bg-sky-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-base-200 focus-visible:ring-primary"
        >
          Continue
        </button>
      </div>
    </div>
  );
};

export default RankUpModal;
