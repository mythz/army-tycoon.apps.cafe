
import React from 'react';
import { SkullIcon } from './icons';

interface GameOverModalProps {
  onRestart: () => void;
  reason: 'ammo' | 'starvation' | null;
}

const GameOverModal: React.FC<GameOverModalProps> = ({ onRestart, reason }) => {
  const messages = {
    ammo: 'You have run out of ammunition and have no way to produce more. Your army has been defeated.',
    starvation: 'Your troops have succumbed to starvation. A well-fed army is a victorious army. Your command is forfeit.',
  };
  const message = reason ? messages[reason] : 'Your campaign has ended.';

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[100] p-4">
      <div className="bg-base-200 border border-red-500 rounded-xl shadow-2xl p-8 text-center max-w-md w-full transform transition-all animate-jump-in">
        <div className="mx-auto bg-red-500/80 rounded-full w-20 h-20 flex items-center justify-center mb-4 border-4 border-red-500">
          <SkullIcon className="w-12 h-12 text-white" />
        </div>
        <h2 className="text-3xl sm:text-4xl font-black text-red-400 uppercase tracking-wider mb-2">
          Game Over
        </h2>
        <p className="text-gray-300 mb-6">
          {message}
        </p>
        <button
          onClick={onRestart}
          className="w-full bg-primary text-white font-bold py-2 px-4 rounded-lg transition-colors hover:bg-sky-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-base-200 focus-visible:ring-primary"
        >
          Restart Campaign
        </button>
      </div>
    </div>
  );
};

export default GameOverModal;
