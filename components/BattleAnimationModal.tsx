
import React, { useState, useEffect } from 'react';
import { Enemy } from '../types';
import { SwordsIcon, MuzzleFlashIcon } from './icons';
import { playAttackSound, playHitSound } from '../utils/audio';

interface BattleAnimationModalProps {
  playerPower: number;
  enemy: Enemy;
  onAnimationComplete: () => void;
}

const HealthBar: React.FC<{ current: number; max: number; color: string }> = ({ current, max, color }) => {
    const percentage = max > 0 ? (current / max) * 100 : 0;
    return (
        <div className="w-full bg-base-100 rounded-full h-4 shadow-inner overflow-hidden border border-base-300">
            <div
                className={`${color} h-4 rounded-full transition-all duration-300 ease-linear`}
                style={{ width: `${percentage}%` }}
            ></div>
        </div>
    );
};

const BattleAnimationModal: React.FC<BattleAnimationModalProps> = ({ playerPower, enemy, onAnimationComplete }) => {
    const [playerHealth, setPlayerHealth] = useState(playerPower);
    const [enemyHealth, setEnemyHealth] = useState(enemy.militaryPower);
    const [isPlayerTurn, setIsPlayerTurn] = useState(true);
    const [hitEffect, setHitEffect] = useState<'player' | 'enemy' | null>(null);

    useEffect(() => {
        const totalDuration = 4000;
        const tickDuration = 300;
        const totalTicks = totalDuration / tickDuration;

        const playerDamagePerTick = enemy.militaryPower / totalTicks;
        const enemyDamagePerTick = playerPower / totalTicks;

        const interval = setInterval(() => {
            setIsPlayerTurn(prev => {
                if (prev) { // Player was attacking
                    playAttackSound(true);
                    setTimeout(() => playHitSound(false), 100);
                    setEnemyHealth(h => Math.max(0, h - enemyDamagePerTick));
                    setHitEffect('enemy');
                } else { // Enemy was attacking
                    playAttackSound(false);
                    setTimeout(() => playHitSound(true), 100);
                    setPlayerHealth(h => Math.max(0, h - playerDamagePerTick));
                    setHitEffect('player');
                }
                setTimeout(() => setHitEffect(null), tickDuration / 2);
                return !prev;
            });
        }, tickDuration);

        const timeout = setTimeout(() => {
            clearInterval(interval);
            onAnimationComplete();
        }, totalDuration);

        return () => {
            clearInterval(interval);
            clearTimeout(timeout);
        };
    }, []);

    return (
        <div className="fixed inset-0 bg-black/80 flex flex-col items-center justify-center z-[100] p-4 animate-fade-in">
            <div className="w-full max-w-4xl flex justify-between items-center text-white mb-4">
                <div className={`text-center transition-transform duration-150 ${hitEffect === 'player' ? 'scale-105 animate-shake' : ''}`}>
                    <h2 className="text-2xl font-bold text-green-400">Your Forces</h2>
                </div>
                <SwordsIcon className="w-12 h-12 text-red-500 animate-pulse" />
                <div className={`text-center transition-transform duration-150 ${hitEffect === 'enemy' ? 'scale-105 animate-shake' : ''}`}>
                    <h2 className="text-2xl font-bold text-red-400">{enemy.name}</h2>
                </div>
            </div>
            <div className="w-full max-w-4xl grid grid-cols-2 gap-4 items-center relative">
                {/* Player Side */}
                <div className="relative">
                     <div className={`absolute -right-8 top-1/2 -translate-y-1/2 transform transition-opacity duration-100 ${isPlayerTurn ? 'opacity-100' : 'opacity-0'}`}>
                        <MuzzleFlashIcon className="w-16 h-16 text-yellow-300 animate-ping-short"/>
                    </div>
                </div>
                {/* Enemy Side */}
                <div className="relative">
                    <div className={`absolute -left-8 top-1/2 -translate-y-1/2 transform transition-opacity duration-100 ${!isPlayerTurn ? 'opacity-100' : 'opacity-0'}`}>
                        <MuzzleFlashIcon className="w-16 h-16 text-orange-400 animate-ping-short"/>
                    </div>
                </div>
            </div>
             <div className="w-full max-w-4xl grid grid-cols-2 gap-8 mt-4">
                <HealthBar current={playerHealth} max={playerPower} color="bg-green-500" />
                <HealthBar current={enemyHealth} max={enemy.militaryPower} color="bg-red-500" />
            </div>
            
            <style>{`
                @keyframes shake {
                    0%, 100% { transform: translateX(0) scale(1.05); }
                    10%, 30%, 50%, 70%, 90% { transform: translateX(-5px) scale(1.05); }
                    20%, 40%, 60%, 80% { transform: translateX(5px) scale(1.05); }
                }
                .animate-shake {
                    animation: shake 0.5s ease-in-out;
                }
                 @keyframes ping-short {
                    0% { transform: scale(1); opacity: 1; }
                    100% { transform: scale(1.5); opacity: 0; }
                }
                .animate-ping-short {
                    animation: ping-short 0.3s cubic-bezier(0, 0, 0.2, 1);
                }
                 @keyframes fade-in {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }
                .animate-fade-in {
                    animation: fade-in 0.5s ease-out;
                }
            `}</style>
        </div>
    );
};

export default BattleAnimationModal;
