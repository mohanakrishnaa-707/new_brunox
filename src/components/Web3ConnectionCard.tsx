import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Wallet, Zap, Shield, ExternalLink, CheckCircle2, XCircle, AlertCircle } from 'lucide-react';
import { useWeb3 } from '@/hooks/useWeb3';

export const Web3ConnectionCard = () => {
  const { account, balance, isConnected, isConnecting, hasMetaMask, isGanacheRunning, connectWallet, disconnectWallet } = useWeb3();

  const getConnectionStatus = () => {
    if (!hasMetaMask) {
      return {
        icon: <XCircle className="w-5 h-5 text-destructive" />,
        title: 'MetaMask Not Installed',
        variant: 'destructive' as const,
        description: 'Install MetaMask to use blockchain features'
      };
    }
    if (isConnected && isGanacheRunning) {
      return {
        icon: <CheckCircle2 className="w-5 h-5 text-green-500" />,
        title: 'Connected to Ganache',
        variant: 'default' as const,
        description: 'Blockchain features enabled'
      };
    }
    if (isConnected && !isGanacheRunning) {
      return {
        icon: <AlertCircle className="w-5 h-5 text-yellow-500" />,
        title: 'Wrong Network',
        variant: 'secondary' as const,
        description: 'Please switch to Ganache network'
      };
    }
    return {
      icon: <Wallet className="w-5 h-5 text-muted-foreground" />,
      title: 'Not Connected',
      variant: 'secondary' as const,
      description: 'Connect your wallet to get started'
    };
  };

  const status = getConnectionStatus();

  return (
    <Card className="border-2 transition-smooth hover:shadow-ocean">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Wallet className="w-5 h-5 text-primary" />
            Blockchain Wallet
          </div>
          <Badge variant={status.variant as any} className="flex items-center gap-1">
            {status.icon}
            <span className="hidden sm:inline">{status.title}</span>
          </Badge>
        </CardTitle>
        <CardDescription>{status.description}</CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Connection Status */}
        {!hasMetaMask && (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="text-sm">
              <strong>MetaMask Required</strong>
              <p className="mt-1">Install MetaMask browser extension to connect your wallet.</p>
              <Button
                variant="outline"
                size="sm"
                className="mt-2"
                onClick={() => window.open('https://metamask.io/download/', '_blank')}
              >
                <ExternalLink className="w-3 h-3 mr-2" />
                Install MetaMask
              </Button>
            </AlertDescription>
          </Alert>
        )}

        {hasMetaMask && !isConnected && (
          <Alert>
            <Shield className="h-4 w-4" />
            <AlertDescription className="text-sm">
              <strong>Quick Setup Guide:</strong>
              <ol className="mt-2 ml-4 space-y-1 text-xs list-decimal">
                <li>Make sure Ganache is running on <code className="bg-muted px-1 py-0.5 rounded">http://127.0.0.1:7545</code></li>
                <li>Import a Ganache account to MetaMask using its private key</li>
                <li>Click "Connect Wallet" below</li>
              </ol>
              <Button
                variant="link"
                size="sm"
                className="mt-2 p-0 h-auto text-xs"
                onClick={() => window.open('/GANACHE_METAMASK_SETUP.md', '_blank')}
              >
                <ExternalLink className="w-3 h-3 mr-1" />
                View Full Setup Guide
              </Button>
            </AlertDescription>
          </Alert>
        )}

        {isConnected && !isGanacheRunning && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="text-sm">
              <strong>Wrong Network Detected</strong>
              <p className="mt-1">Please switch to Ganache Local network in MetaMask.</p>
              <ul className="mt-2 ml-4 space-y-1 text-xs list-disc">
                <li>Open MetaMask</li>
                <li>Select "Ganache Local" from network dropdown</li>
                <li>If not listed, click "Connect Wallet" to add it</li>
              </ul>
            </AlertDescription>
          </Alert>
        )}

        {/* Wallet Info */}
        {isConnected && (
          <div className="space-y-3 p-3 bg-muted/50 rounded-lg">
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">Account</span>
              {isGanacheRunning && (
                <Badge variant="outline" className="text-xs flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3 text-green-500" />
                  Verified
                </Badge>
              )}
            </div>
            <p className="text-xs font-mono bg-background p-2 rounded truncate" title={account || ''}>
              {account}
            </p>
            
            <div className="flex items-center justify-between pt-2 border-t border-border">
              <span className="text-xs text-muted-foreground">Balance</span>
              <div className="flex items-center gap-1">
                <Zap className="w-3 h-3 text-primary" />
                <span className="text-sm font-semibold">
                  {parseFloat(balance).toFixed(4)} ETH
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Action Button */}
        <div className="pt-2">
          {!isConnected ? (
            <Button 
              onClick={connectWallet}
              disabled={isConnecting}
              className="w-full gradient-ocean text-white hover:shadow-glow transition-smooth"
            >
              {isConnecting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                  Connecting...
                </>
              ) : (
                <>
                  <Wallet className="w-4 h-4 mr-2" />
                  Connect Wallet
                </>
              )}
            </Button>
          ) : (
            <div className="space-y-2">
              {isGanacheRunning && (
                <div className="flex items-center gap-2 text-xs text-muted-foreground p-2 bg-green-500/10 rounded border border-green-500/20">
                  <Shield className="w-3 h-3 text-green-500" />
                  Messages will be verified on the blockchain
                </div>
              )}
              <Button 
                onClick={disconnectWallet}
                variant="outline"
                size="sm"
                className="w-full"
              >
                Disconnect Wallet
              </Button>
            </div>
          )}
        </div>

        {/* Help Text */}
        <div className="text-xs text-muted-foreground text-center pt-2 border-t border-border">
          Need help? Check the{' '}
          <button
            onClick={() => window.open('/GANACHE_METAMASK_SETUP.md', '_blank')}
            className="text-primary hover:underline"
          >
            setup guide
          </button>
        </div>
      </CardContent>
    </Card>
  );
};
