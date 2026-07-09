import { useAccount, useSwitchChain } from 'wagmi';
import { SUPPORTED_CHAINS, DEFAULT_CHAIN_ID, ChainConfig } from '../config/chains';

export function useCurrentChain(): ChainConfig {
  const { chainId } = useAccount();
  const config = chainId && SUPPORTED_CHAINS[chainId] ? SUPPORTED_CHAINS[chainId] : SUPPORTED_CHAINS[DEFAULT_CHAIN_ID];
  return config;
}

export function useContracts() {
  const config = useCurrentChain();
  return config.contracts;
}

export function useSwitchNetwork() {
  const { switchChain } = useSwitchChain();
  
  return {
    switchNetwork: (chainId: number) => {
      if (switchChain) {
        switchChain({ chainId });
      }
    }
  };
}

export function useExplorer() {
  const config = useCurrentChain();
  const baseUrl = config.chain.blockExplorers?.default.url;

  return {
    getAddressUrl: (address: string) => `${baseUrl}/address/${address}`,
    getTransactionUrl: (txHash: string) => `${baseUrl}/tx/${txHash}`,
  };
}
