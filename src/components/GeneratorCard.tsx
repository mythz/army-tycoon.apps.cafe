



import React, { useState, useMemo } from 'react';
import { ResourceGenerator, PurchaseAmount, Resources, ResourceType } from '../types';
import { MoneyIcon, SteelIcon, OilIcon, IncomeIcon } from './icons';

interface GeneratorCardProps {
  generator: ResourceGenerator;
  resources: Resources;
  onPurchase: (generatorId: string, amount: PurchaseAmount) => void;
  formatNumber: (num: number) => string;
}

const resourceIcons: Record<ResourceType, React.ReactNode> = {
    gold: <MoneyIcon className="w-4 h-4 text-yellow-400" />,
    steel: <SteelIcon className="w-4 h-4 text-gray-400" />,
    oil: <OilIcon className="w-4 h-4 text-purple-400" />,
};

const GeneratorCard: React.FC<GeneratorCardProps> = ({ generator, resources, onPurchase, formatNumber }) => {
  const [purchaseAmount, setPurchaseAmount] = useState<PurchaseAmount>(1);

  const purchaseOptions: PurchaseAmount[] = [1, 10, 'MAX'];

  const canAfford = (cost: Resources, amount: number = 1) => {
    return Object.entries(cost).every(([resource, value]) => {
        // FIX: Ensure value is a number before arithmetic operation.
        return (resources[resource as ResourceType] ?? 0) >= (Number(value) || 0) * amount;
    });
  };

  const getMaxBuy = () => {
    let max = Infinity;
    for (const [resource, value] of Object.entries(generator.cost)) {
        // FIX: Check if value is a number and greater than 0 to prevent type errors.
        if (typeof value === 'number' && value > 0) {
            const resourceAmount = resources[resource as ResourceType] ?? 0;
            // FIX: Cast value to number to avoid potential type errors despite the check above.
            max = Math.min(max, Math.floor(resourceAmount / (value as number)));
        }
    }
    return max === Infinity ? 0 : max;
  };
  
  const currentCanAfford = useMemo(() => {
    if (purchaseAmount === 'MAX') {
      return getMaxBuy() > 0;
    }
    return canAfford(generator.cost, purchaseAmount);
  }, [resources, purchaseAmount, generator.cost]);
  
  return (
    <div className="bg-base-200 border border-base-300 rounded-lg shadow-lg overflow-hidden transition-all duration-300 hover:shadow-2xl hover:border-secondary/50 flex flex-col">
      <img src={generator.imageUrl} alt={generator.name} className="w-full h-32 object-cover" />
      <div className="p-4 flex flex-col flex-grow">
        <h3 className="text-xl font-bold text-white">{generator.name}</h3>
        <p className="text-sm text-gray-400 mb-2">Owned: <span className="font-semibold text-secondary">{formatNumber(generator.owned)}</span></p>
        <p className="text-xs text-gray-300 mb-3">{generator.description}</p>


        <div className="flex justify-between text-sm mb-4">
            <div className="flex items-center gap-2 flex-wrap">
                <span className="font-semibold">Cost:</span>
                {Object.entries(generator.cost).map(([resource, value]) => (
                    <div key={resource} className="flex items-center gap-1">
                        {resourceIcons[resource as ResourceType]}
                        <span>{formatNumber(value ?? 0)}</span>
                    </div>
                ))}
            </div>
             <div className="flex items-center gap-2 flex-wrap">
                {Object.entries(generator.production).map(([resource, value]) => (
                    <div key={resource} className="flex items-center gap-1">
                        <IncomeIcon className="w-4 h-4 text-accent" />
                        <span>+{formatNumber(value ?? 0)}/s</span>
                    </div>
                ))}
            </div>
        </div>

        <div className="mt-auto">
            <div className="flex justify-between items-center bg-base-300 rounded-md p-1 mb-3">
            {purchaseOptions.map(amount => (
                <button
                key={amount}
                onClick={() => setPurchaseAmount(amount)}
                className={`px-3 py-1 text-xs font-bold rounded-md transition-colors w-full ${purchaseAmount === amount ? 'bg-secondary text-white' : 'bg-transparent text-gray-300 hover:bg-base-100'}`}
                >
                x{amount}
                </button>
            ))}
            </div>
            <button
                onClick={() => onPurchase(generator.id, purchaseAmount)}
                disabled={!currentCanAfford}
                className="w-full bg-secondary/80 text-white font-bold py-2 px-4 rounded-lg transition-all duration-200 enabled:hover:bg-secondary enabled:active:scale-95 disabled:bg-gray-600 disabled:cursor-not-allowed"
                >
                Build ({purchaseAmount === 'MAX' ? formatNumber(getMaxBuy()) : purchaseAmount})
            </button>
        </div>
      </div>
    </div>
  );
};

export default GeneratorCard;
