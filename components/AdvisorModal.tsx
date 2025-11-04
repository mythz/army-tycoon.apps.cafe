
import React from 'react';
import { BrainCircuitIcon } from './icons';

interface AdvisorModalProps {
  isOpen: boolean;
  onClose: () => void;
  advice: string;
  isLoading: boolean;
}

const AdvisorModal: React.FC<AdvisorModalProps> = ({ isOpen, onClose, advice, isLoading }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div 
        className="bg-base-200 border border-primary/50 rounded-xl shadow-2xl p-6 max-w-lg w-full transform transition-all animate-jump-in"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center mb-4">
          <BrainCircuitIcon className="w-8 h-8 text-primary mr-3" />
          <h2 className="text-2xl font-bold text-primary">Strategy Advisor</h2>
        </div>
        
        <div className="bg-base-100 rounded-md p-4 min-h-[16rem] max-h-[60vh] overflow-y-auto border border-base-300">
          {isLoading ? (
            <div className="flex items-center justify-center h-full">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
          ) : (
            <p className="text-gray-300 whitespace-pre-wrap">{advice}</p>
          )}
        </div>
        
        <button
          onClick={onClose}
          className="mt-6 w-full bg-primary text-white font-bold py-2 px-4 rounded-lg transition-colors hover:bg-sky-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-base-200 focus-visible:ring-primary"
        >
          Understood
        </button>
      </div>
    </div>
  );
};

export default AdvisorModal;
