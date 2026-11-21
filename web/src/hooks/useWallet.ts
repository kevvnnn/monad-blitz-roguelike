'use client';

import { useState, useEffect, useCallback } from 'react';
import { createWalletClient, custom } from 'viem';
import { MONAD_TESTNET } from '../contracts/viem';

export function useWallet() {
  const [walletClient, setWalletClient] = useState<any>(null);
  const [address, setAddress] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isDemoMode, setIsDemoMode] = useState(true); // Default to demo so the game is immediately playable
  const [error, setError] = useState<string | null>(null);

  // Re-check existing connection on mount
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const eth = (window as any).ethereum;
    if (eth && eth.selectedAddress) {
      const client = createWalletClient({
        account: eth.selectedAddress as `0x${string}`,
        chain: MONAD_TESTNET,
        transport: custom(eth),
      });
      setWalletClient(client);
      setAddress(eth.selectedAddress);
      setIsConnected(true);
      setIsDemoMode(false);
    }
  }, []);

  const connect = useCallback(async () => {
    try {
      setError(null);
      if (typeof window === 'undefined' || !(window as any).ethereum) {
        setError('No Web3 wallet found. Playing in Simulated Monad Testnode mode.');
        setIsDemoMode(true);
        return;
      }

      const provider = (window as any).ethereum;
      const accounts = await provider.request({ method: 'eth_requestAccounts' });
      if (!accounts || accounts.length === 0) {
        throw new Error('No accounts selected');
      }

      const addr = accounts[0] as `0x${string}`;

      // Prompt switch to Monad testnet
      try {
        await provider.request({
          method: 'wallet_switchEthereumChain',
          params: [{ chainId: `0x${MONAD_TESTNET.id.toString(16)}` }],
        });
      } catch (switchError: any) {
        if (switchError.code === 4902 || switchError.data?.originalError?.code === 4902) {
          try {
            await provider.request({
              method: 'wallet_addEthereumChain',
              params: [
                {
                  chainId: `0x${MONAD_TESTNET.id.toString(16)}`,
                  chainName: 'Monad Testnet',
                  nativeCurrency: { name: 'MON', symbol: 'MON', decimals: 18 },
                  rpcUrls: ['https://testnet-rpc.monad.xyz'],
                  blockExplorerUrls: ['https://testnet.monadscan.com'],
                },
              ],
            });
          } catch (addError: any) {
            console.warn('Failed to add Monad Testnet network:', addError);
          }
        }
      }

      const client = createWalletClient({
        account: addr,
        chain: MONAD_TESTNET,
        transport: custom(provider),
      });

      setWalletClient(client);
      setAddress(addr);
      setIsConnected(true);
      setIsDemoMode(false);
    } catch (err: any) {
      console.error('Wallet connection failed:', err);
      setError(err.message || 'Connection failed');
    }
  }, []);

  const disconnect = useCallback(() => {
    setWalletClient(null);
    setAddress(null);
    setIsConnected(false);
    setIsDemoMode(true);
  }, []);

  return {
    walletClient,
    address,
    isConnected,
    isDemoMode,
    setIsDemoMode,
    connect,
    disconnect,
    error,
  };
}
