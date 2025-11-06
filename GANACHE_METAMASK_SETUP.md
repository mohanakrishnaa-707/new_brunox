# Ganache & MetaMask Setup Guide

Complete guide for setting up Ganache local blockchain and MetaMask wallet integration with BrunoX Chat.

---

## Table of Contents
1. [Prerequisites](#prerequisites)
2. [Installing Ganache](#installing-ganache)
3. [Setting Up Ganache](#setting-up-ganache)
4. [Installing MetaMask](#installing-metamask)
5. [Connecting MetaMask to Ganache](#connecting-metamask-to-ganache)
6. [Importing Ganache Accounts to MetaMask](#importing-ganache-accounts-to-metamask)
7. [Connecting the Application](#connecting-the-application)
8. [Testing the Connection](#testing-the-connection)
9. [Troubleshooting](#troubleshooting)

---

## Prerequisites

Before you begin, ensure you have:
- **Node.js** (v16 or higher) installed
- **npm** or **yarn** package manager
- A modern web browser (Chrome, Firefox, or Brave recommended)
- Basic understanding of blockchain and Ethereum concepts

---

## Installing Ganache

### Option 1: Ganache GUI (Recommended for Beginners)

1. **Download Ganache**
   - Visit: https://trufflesuite.com/ganache/
   - Download the installer for your operating system:
     - Windows: `.exe` installer
     - macOS: `.dmg` installer
     - Linux: `.AppImage` file

2. **Install Ganache**
   - Run the installer and follow the installation wizard
   - Launch Ganache after installation

### Option 2: Ganache CLI (For Advanced Users)

```bash
# Install Ganache CLI globally
npm install -g ganache

# Or using yarn
yarn global add ganache
```

---

## Setting Up Ganache

### Using Ganache GUI

1. **Launch Ganache**
   - Open the Ganache application

2. **Create a New Workspace**
   - Click "New Workspace" or "Quickstart"
   - Choose "Ethereum" as the blockchain type

3. **Configure Workspace Settings**
   - **Server Tab:**
     - Hostname: `127.0.0.1` (localhost)
     - Port Number: `7545` (default)
     - Network ID: `1337` (or any custom ID)
     - Automine: Enabled (recommended)
   
   - **Accounts & Keys Tab:**
     - Account Default Balance: `100 ETH` (or your preferred amount)
     - Total Accounts to Generate: `10`
     - Mnemonic: You can use a custom mnemonic or let Ganache generate one

4. **Save and Start**
   - Click "Save Workspace"
   - Ganache will start the local blockchain

5. **Note Important Details**
   - **RPC Server URL**: `http://127.0.0.1:7545`
   - **Network ID**: `1337` (or your custom ID)
   - **Mnemonic**: Copy and save this securely (shown in Accounts & Keys tab)

### Using Ganache CLI

```bash
# Start Ganache with default settings
ganache

# Or with custom configuration
ganache --port 7545 --networkId 1337 --accounts 10 --defaultBalanceEther 100

# Start with a specific mnemonic (for reproducible accounts)
ganache --mnemonic "your twelve word mnemonic phrase goes here"
```

**Important**: Keep the terminal running - closing it will stop the blockchain!

---

## Installing MetaMask

1. **Download MetaMask**
   - Visit: https://metamask.io/download/
   - Choose your browser extension:
     - Chrome/Brave: Chrome Web Store
     - Firefox: Firefox Add-ons
     - Edge: Microsoft Edge Add-ons

2. **Install the Extension**
   - Click "Add to [Browser]"
   - Confirm the installation

3. **Set Up MetaMask**
   - Click the MetaMask fox icon in your browser toolbar
   - Click "Get Started"
   - Choose "Create a new wallet" (for first-time users)
   - Create a strong password
   - **IMPORTANT**: Write down your Secret Recovery Phrase (12 words)
   - Store it safely - you'll need it to recover your wallet
   - Confirm your Secret Recovery Phrase
   - Click "All Done"

---

## Connecting MetaMask to Ganache

### Step 1: Add Ganache Network to MetaMask

1. **Open MetaMask**
   - Click the MetaMask icon in your browser

2. **Access Network Settings**
   - Click the network dropdown at the top (shows "Ethereum Mainnet" by default)
   - Click "Add Network" or "Add a network manually"

3. **Configure Network Settings**
   Enter the following details:

   ```
   Network Name: Ganache Local
   New RPC URL: http://127.0.0.1:7545
   Chain ID: 1337
   Currency Symbol: ETH
   Block Explorer URL: (leave empty)
   ```

4. **Save the Network**
   - Click "Save"
   - MetaMask will switch to the Ganache network automatically

5. **Verify Connection**
   - You should see "Ganache Local" at the top of MetaMask
   - Your account balance should show 0 ETH (we'll import accounts next)

---

## Importing Ganache Accounts to MetaMask

### Method 1: Import Using Private Key (Recommended)

1. **Get Private Key from Ganache**
   - Open Ganache
   - Click the key icon (🔑) next to any account
   - Copy the "Private Key" (NOT the public address)

2. **Import to MetaMask**
   - Open MetaMask
   - Click the account icon (circle) at the top right
   - Click "Import Account"
   - Select "Private Key" from the dropdown
   - Paste the private key
   - Click "Import"

3. **Verify Import**
   - You should now see the account with 100 ETH balance
   - The account address should match the one in Ganache

4. **Import Multiple Accounts** (Optional)
   - Repeat the process for other accounts
   - Recommended: Import at least 2-3 accounts for testing

### Method 2: Import Using Seed Phrase

1. **Reset MetaMask (CAUTION)**
   - Only do this if you're using a fresh MetaMask installation
   - Settings → Advanced → Reset Account

2. **Restore Using Ganache Mnemonic**
   - "Import using Secret Recovery Phrase"
   - Enter the mnemonic from Ganache
   - This will import all 10 accounts at once

---

## Connecting the Application

### Step 1: Start the Application

```bash
# Navigate to project directory
cd brunox-chat

# Install dependencies (if not done already)
npm install

# Start the development server
npm run dev
```

### Step 2: Open the Application

- Open your browser
- Navigate to: `http://localhost:8080` (or the URL shown in terminal)

### Step 3: Connect MetaMask

1. **Navigate to Chat Page**
   - Sign in to your account
   - Go to the Chat page

2. **Connect Wallet**
   - Look for the "Blockchain Status" card in the sidebar
   - Click "Connect Wallet" button
   - MetaMask popup will appear

3. **Approve Connection**
   - MetaMask will ask for permission to connect
   - Review the permissions
   - Click "Next" → "Connect"

4. **Verify Connection**
   - You should see:
     - Status: "Connected"
     - Your account address (truncated)
     - Your ETH balance
   - The wallet icon should turn green

### Step 4: Test Smart Contract Deployment

The application will automatically:
1. Deploy the chat smart contract to Ganache
2. Store the contract address
3. Enable blockchain-verified messaging

**Check Ganache**:
- Open Ganache
- Go to "Transactions" tab
- You should see the contract deployment transaction
- Go to "Contracts" tab to see the deployed contract

---

## Testing the Connection

### Test 1: Send a Message

1. **Start a Conversation**
   - Select a friend from the sidebar
   - Or create a new conversation

2. **Send a Message**
   - Type a message
   - Click Send
   - Watch for blockchain verification

3. **Check Ganache**
   - Open Ganache → Transactions
   - You should see a new transaction for the message
   - View transaction details to see the message hash

### Test 2: Multiple Accounts

1. **Switch MetaMask Accounts**
   - Click MetaMask account icon
   - Select a different imported account

2. **Refresh the Application**
   - The application should detect the new account
   - Balance should update

3. **Test Cross-Account Messaging**
   - Send messages between different accounts
   - Verify each transaction appears in Ganache

### Test 3: Balance Check

1. **Send Multiple Messages**
   - Each message costs gas
   - Watch your balance decrease slightly

2. **Check Gas Usage in Ganache**
   - Ganache → Transactions
   - Each transaction shows gas used
   - Your account balance reflects gas costs

---

## Troubleshooting

### Issue: MetaMask Can't Connect to Ganache

**Solution:**
```bash
# Check if Ganache is running
# Verify the RPC URL is correct: http://127.0.0.1:7545

# In MetaMask:
1. Settings → Networks → Ganache Local
2. Verify RPC URL: http://127.0.0.1:7545
3. Verify Chain ID: 1337
4. Save and try again
```

### Issue: Account Balance Shows 0 ETH

**Problem**: Wrong network or account not imported

**Solution:**
1. Verify MetaMask is on "Ganache Local" network
2. Import accounts using private keys from Ganache
3. Check that Ganache is running

### Issue: "Nonce Too High" Error

**Problem**: MetaMask and Ganache are out of sync

**Solution:**
```bash
# In MetaMask:
1. Settings → Advanced → Clear Activity Tab Data
2. Settings → Advanced → Reset Account
3. Refresh the application
```

### Issue: Transaction Fails

**Problem**: Insufficient gas or contract error

**Solution:**
```bash
# Check Ganache console for error messages
# Verify account has enough ETH
# Check if contract is deployed:
# - Ganache → Contracts tab should show the contract
```

### Issue: MetaMask Not Detecting Application

**Problem**: Connection permission not granted

**Solution:**
```bash
# In MetaMask:
1. Settings → Connected Sites
2. Check if your application URL is listed
3. If not, try connecting again from the app
4. If listed but not working, disconnect and reconnect
```

### Issue: Ganache Crashes or Freezes

**Solution:**
```bash
# Stop Ganache
# Delete workspace data:
# - Windows: %APPDATA%/Ganache
# - macOS: ~/Library/Application Support/Ganache
# - Linux: ~/.config/Ganache

# Restart Ganache and create a new workspace
# Re-import accounts to MetaMask
```

### Issue: "Chain ID Mismatch" Error

**Problem**: MetaMask chain ID doesn't match Ganache

**Solution:**
```bash
# In MetaMask network settings:
# Set Chain ID to exactly: 1337

# In Ganache:
# Verify Network ID is: 1337

# Restart both and try again
```

---

## Advanced Configuration

### Custom Gas Settings

In MetaMask:
1. Settings → Advanced → Advanced Gas Controls (Enable)
2. When sending transactions, you can now customize:
   - Gas Limit
   - Max Base Fee
   - Priority Fee

### Multiple Ganache Instances

```bash
# Run multiple Ganache instances on different ports
ganache --port 7545 --networkId 1337  # Instance 1
ganache --port 8545 --networkId 1338  # Instance 2

# Add both networks to MetaMask with different configurations
```

### Persistent Ganache Database

```bash
# Save blockchain state between restarts
ganache --db ./ganache-data --port 7545

# This creates a ganache-data folder with persistent storage
```

---

## Security Notes

⚠️ **IMPORTANT SECURITY WARNINGS**

1. **Never use Ganache accounts on mainnet**
   - These accounts are for testing only
   - Private keys are easily accessible
   - Anyone with Ganache can derive these keys

2. **Don't use real funds**
   - Ganache is for development/testing
   - Use testnet or mainnet for real transactions

3. **Keep your mnemonic safe**
   - If you're using a custom mnemonic in Ganache
   - Never share it publicly
   - Store it securely

4. **Development only**
   - This setup is for local development
   - Not suitable for production use

---

## Next Steps

After successful setup:

1. ✅ **Explore the Chat Features**
   - Send blockchain-verified messages
   - Create group chats
   - Add friends

2. ✅ **Monitor Transactions**
   - Watch Ganache for real-time transaction updates
   - Learn about gas costs and blockchain mechanics

3. ✅ **Experiment with Smart Contracts**
   - Modify the contract code
   - Redeploy and test changes
   - Learn Solidity development

4. ✅ **Test Edge Cases**
   - Multiple users
   - Network failures
   - Transaction failures

---

## Useful Resources

- **Ganache Documentation**: https://trufflesuite.com/docs/ganache/
- **MetaMask Documentation**: https://docs.metamask.io/
- **Web3.js Documentation**: https://web3js.readthedocs.io/
- **Ethereum Development**: https://ethereum.org/en/developers/
- **Solidity Documentation**: https://docs.soliditylang.org/

---

## Support

If you encounter issues not covered in this guide:

1. Check the main README.md file
2. Review Ganache logs for error messages
3. Check browser console for JavaScript errors
4. Verify all versions are compatible

---

**Happy Building! 🚀**
