import { createContext, useContext, useState, useEffect } from 'react';
import { ethers } from 'ethers';

interface Web3ContextType {
  account: string | null;
  balance: string;
  isConnected: boolean;
  isConnecting: boolean;
  hasMetaMask: boolean;
  isGanacheRunning: boolean;
  connectWallet: () => Promise<void>;
  disconnectWallet: () => void;
  signMessage: (message: string) => Promise<string>;
}

const Web3Context = createContext<Web3ContextType | undefined>(undefined);

export const Web3Provider = ({ children }: { children: React.ReactNode }) => {
  const [account, setAccount] = useState<string | null>(null);
  const [balance, setBalance] = useState('0');
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [hasMetaMask, setHasMetaMask] = useState(false);
  const [isGanacheRunning, setIsGanacheRunning] = useState(false);

  useEffect(() => {
    // Check if MetaMask is installed
    const checkMetaMask = () => {
      setHasMetaMask(!!window.ethereum);
    };
    
    checkMetaMask();
    checkConnection();
    
    // Listen for account and network changes
    if (window.ethereum) {
      window.ethereum.on('accountsChanged', handleAccountsChanged);
      window.ethereum.on('chainChanged', handleChainChanged);
    }
    
    return () => {
      if (window.ethereum) {
        window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
        window.ethereum.removeListener('chainChanged', handleChainChanged);
      }
    };
  }, []);
  
  const handleAccountsChanged = async (accounts: string[]) => {
    if (accounts.length === 0) {
      disconnectWallet();
    } else {
      setAccount(accounts[0]);
      await getBalance(accounts[0]);
      await checkGanacheNetwork();
    }
  };
  
  const handleChainChanged = () => {
    window.location.reload();
  };

  const checkGanacheNetwork = async () => {
    if (!window.ethereum) return;
    
    try {
      const chainId = await window.ethereum.request({ method: 'eth_chainId' });
      setIsGanacheRunning(chainId === '0x539'); // 1337 in hex
    } catch (error) {
      console.error('Error checking network:', error);
      setIsGanacheRunning(false);
    }
  };

  const checkConnection = async () => {
    if (typeof window !== 'undefined' && window.ethereum) {
      try {
        const accounts = await window.ethereum.request({ method: 'eth_accounts' });
        if (accounts.length > 0) {
          setAccount(accounts[0]);
          setIsConnected(true);
          await getBalance(accounts[0]);
          await checkGanacheNetwork();
        }
      } catch (error) {
        console.error('Error checking connection:', error);
      }
    }
  };

  const getBalance = async (address: string) => {
    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const balance = await provider.getBalance(address);
      setBalance(ethers.formatEther(balance));
    } catch (error) {
      console.error('Error getting balance:', error);
    }
  };

  const connectWallet = async () => {
    if (!window.ethereum) {
      const installUrl = 'https://metamask.io/download/';
      const message = 
        '🦊 MetaMask Not Detected!\n\n' +
        'To use blockchain features, you need MetaMask:\n\n' +
        '1. Click OK to open MetaMask download page\n' +
        '2. Install the browser extension\n' +
        '3. Set up your wallet\n' +
        '4. Come back and click "Connect Wallet" again\n\n' +
        'Need help? Check the GANACHE_METAMASK_SETUP.md guide!';
      
      if (confirm(message)) {
        window.open(installUrl, '_blank');
      }
      return;
    }

    setIsConnecting(true);
    try {
      // First, try to switch to Ganache network
      let networkSwitched = false;
      try {
        await window.ethereum.request({
          method: 'wallet_switchEthereumChain',
          params: [{ chainId: '0x539' }], // 1337 in hex (Ganache default)
        });
        networkSwitched = true;
      } catch (switchError: any) {
        // Network doesn't exist, try to add it
        if (switchError.code === 4902) {
          try {
            await window.ethereum.request({
              method: 'wallet_addEthereumChain',
              params: [{
                chainId: '0x539',
                chainName: 'Ganache Local',
                nativeCurrency: {
                  name: 'Ethereum',
                  symbol: 'ETH',
                  decimals: 18,
                },
                rpcUrls: ['http://127.0.0.1:7545'],
              }],
            });
            networkSwitched = true;
          } catch (addError) {
            console.error('Error adding Ganache network:', addError);
            alert(
              '⚠️ Cannot Add Ganache Network\n\n' +
              'Please add manually in MetaMask:\n\n' +
              '• Network Name: Ganache Local\n' +
              '• RPC URL: http://127.0.0.1:7545\n' +
              '• Chain ID: 1337\n' +
              '• Currency Symbol: ETH\n\n' +
              'See GANACHE_METAMASK_SETUP.md for detailed instructions!'
            );
            setIsConnecting(false);
            return;
          }
        } else if (switchError.code === 4001) {
          // User rejected
          console.log('User rejected network switch');
          setIsConnecting(false);
          return;
        } else {
          console.error('Error switching network:', switchError);
        }
      }

      // Request account access
      const accounts = await window.ethereum.request({
        method: 'eth_requestAccounts',
      });
      
      setAccount(accounts[0]);
      setIsConnected(true);
      setIsGanacheRunning(networkSwitched);
      await getBalance(accounts[0]);
      
      // Success message
      console.log('✅ Connected to Ganache!');
      console.log('Account:', accounts[0]);
      
      // Show helpful info if not on Ganache
      if (!networkSwitched) {
        const currentChainId = await window.ethereum.request({ method: 'eth_chainId' });
        if (currentChainId !== '0x539') {
          alert(
            '⚠️ Not Connected to Ganache\n\n' +
            'You\'re connected, but not to Ganache network.\n\n' +
            'To use blockchain features:\n' +
            '1. Make sure Ganache is running on http://127.0.0.1:7545\n' +
            '2. Switch to "Ganache Local" network in MetaMask\n' +
            '3. Import a Ganache account using its private key\n\n' +
            'See GANACHE_METAMASK_SETUP.md for full setup guide!'
          );
        }
      }
    } catch (error: any) {
      console.error('Error connecting wallet:', error);
      
      if (error.code === 4001) {
        alert('Connection cancelled. Please approve the connection in MetaMask to continue.');
      } else if (error.code === -32002) {
        alert('Connection request already pending. Please check MetaMask!');
      } else {
        alert(
          '❌ Connection Failed\n\n' +
          'Please ensure:\n' +
          '✓ MetaMask is unlocked\n' +
          '✓ Ganache is running on http://127.0.0.1:7545\n' +
          '✓ You have imported a Ganache account\n\n' +
          'Need help? See GANACHE_METAMASK_SETUP.md'
        );
      }
    } finally {
      setIsConnecting(false);
    }
  };

  const disconnectWallet = () => {
    setAccount(null);
    setBalance('0');
    setIsConnected(false);
  };

  const signMessage = async (message: string): Promise<string> => {
    if (!account) throw new Error('No account connected');
    
    const provider = new ethers.BrowserProvider(window.ethereum);
    const signer = await provider.getSigner();
    return await signer.signMessage(message);
  };

  return (
    <Web3Context.Provider value={{ 
      account, 
      balance, 
      isConnected, 
      isConnecting,
      hasMetaMask,
      isGanacheRunning,
      connectWallet, 
      disconnectWallet,
      signMessage 
    }}>
      {children}
    </Web3Context.Provider>
  );
};

export const useWeb3 = () => {
  const context = useContext(Web3Context);
  if (context === undefined) {
    throw new Error('useWeb3 must be used within a Web3Provider');
  }
  return context;
};

// Global type declaration
declare global {
  interface Window {
    ethereum?: any;
  }
}