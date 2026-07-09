'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useCurrentChain, useSwitchNetwork } from '../hooks/useNetworkConfig';
import { arcTestnetChain, robinhoodTestnetChain } from '../config/chains';
import { ChevronDown, Globe } from 'lucide-react';
import { useAccount } from 'wagmi';

export function NetworkSelector() {
  const currentChain = useCurrentChain();
  const { switchNetwork } = useSwitchNetwork();
  const { isConnected } = useAccount();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (!isConnected) return null;

  const networks = [arcTestnetChain, robinhoodTestnetChain];

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-[rgba(255,255,255,0.1)] bg-[rgba(255,255,255,0.03)] hover:bg-[rgba(255,255,255,0.08)] transition-all duration-200"
        style={{
          boxShadow: 'inset 0 1px 0 0 rgba(255, 255, 255, 0.05)',
        }}
      >
        <div 
          className="w-2 h-2 rounded-full" 
          style={{ 
            backgroundColor: currentChain.chain.id === robinhoodTestnetChain.id ? '#00c805' : '#8b5cf6',
            boxShadow: `0 0 8px ${currentChain.chain.id === robinhoodTestnetChain.id ? '#00c805' : '#8b5cf6'}` 
          }} 
        />
        <span className="text-sm font-medium text-white/90">
          {currentChain.chain.name}
        </span>
        <ChevronDown size={14} className={`text-white/50 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div 
          className="absolute right-0 mt-2 w-56 rounded-xl border border-[rgba(255,255,255,0.1)] bg-[#0A0A0A] overflow-hidden z-50 animate-slide-up"
          style={{
            boxShadow: '0 4px 24px -4px rgba(0,0,0,0.5), inset 0 1px 0 0 rgba(255, 255, 255, 0.05)',
            backdropFilter: 'blur(12px)',
          }}
        >
          <div className="p-2">
            <div className="px-2 py-1.5 text-xs font-medium text-white/40 uppercase tracking-wider mb-1">
              Select Network
            </div>
            {networks.map((network) => (
              <button
                key={network.id}
                onClick={() => {
                  switchNetwork(network.id);
                  setIsOpen(false);
                }}
                className={`w-full flex items-center gap-3 px-2 py-2 rounded-lg transition-all duration-200 ${
                  currentChain.chain.id === network.id 
                    ? 'bg-[rgba(255,255,255,0.08)]' 
                    : 'hover:bg-[rgba(255,255,255,0.04)]'
                }`}
              >
                <div 
                  className="w-2 h-2 rounded-full" 
                  style={{ 
                    backgroundColor: network.id === robinhoodTestnetChain.id ? '#00c805' : '#8b5cf6',
                    opacity: currentChain.chain.id === network.id ? 1 : 0.4
                  }} 
                />
                <span className={`text-sm ${currentChain.chain.id === network.id ? 'text-white font-medium' : 'text-white/60'}`}>
                  {network.name}
                </span>
                {currentChain.chain.id === network.id && (
                  <span className="ml-auto text-xs text-white/40">Active</span>
                )}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
