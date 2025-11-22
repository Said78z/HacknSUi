# SUI Hackathon Project 🚀

A full-stack decentralized application (dApp) built on the SUI blockchain, featuring Move smart contracts, Walrus decentralized storage, and a modern React frontend.

Based on the **BSA SUI Template 2025** with enhanced features for hackathon development.

## Project Structure

```
Hackaton SUI/
├── move/                   # Move smart contracts
│   ├── sources/
│   │   ├── counter.move   # Counter smart contract with events
│   │   └── example.move   # Example contract template
│   ├── tests/             # Contract tests
│   └── Move.toml          # Move package configuration
├── frontend/              # React frontend application (Vite)
│   ├── src/
│   │   ├── components/
│   │   │   ├── ui/        # Shadcn UI components (Button, Card, Alert)
│   │   │   └── WalrusUpload.tsx  # Walrus storage upload component
│   │   ├── services/
│   │   │   └── walrusService.ts  # Walrus SDK integration
│   │   ├── lib/
│   │   │   └── utils.ts   # Utility functions
│   │   ├── App.tsx        # Main application with navigation
│   │   ├── config.ts      # Network configuration
│   │   ├── providers.tsx  # SUI wallet providers
│   │   └── main.tsx       # Application entry point
│   ├── package.json
│   └── vite.config.ts
├── docker-compose.yml     # Docker orchestration
├── Dockerfile            # Frontend Docker image
└── package.json          # Root package configuration
```

## Features ✨

### Smart Contracts (Move)
- **Counter Contract**: Shared object with increment/set operations
- **Event Emission**: Track counter changes with timestamps
- **Owner Capabilities**: Admin-only functions with OwnerCap
- **Comprehensive Tests**: Full test coverage with test scenarios

### Frontend (React + Vite)
- **Walrus Storage Integration**: Upload files, text, and JSON to decentralized storage
- **Modern UI Components**: Shadcn UI components (Button, Card, Alert)
- **Multi-View Navigation**: Toggle between Counter and Walrus Storage
- **SUI Wallet Integration**: Seamless wallet connection with @mysten/dapp-kit
- **Real-time Updates**: Automatic counter refresh after transactions
- **Transaction History**: Track uploaded files with blob IDs and URLs

### Walrus Decentralized Storage
- **File Upload**: Upload any file type to Walrus network
- **Text Upload**: Store text content on-chain
- **JSON Upload**: Store structured data with validation
- **10 Epoch Storage**: Files stored for ~30 days on testnet
- **Explorer Integration**: Direct links to WalrusCan and SuiVision

### Developer Experience
- **TypeScript**: Full type safety across the stack
- **TailwindCSS**: Beautiful, customizable styling with dark mode support
- **Hot Reload**: Fast development with Vite
- **Docker Support**: Easy deployment with docker-compose
- **Comprehensive Documentation**: Detailed setup and usage guides

## Prerequisites

- [Node.js](https://nodejs.org/) (v18 or higher)
- [SUI CLI](https://docs.sui.io/build/install) installed
- [Docker](https://www.docker.com/) (optional, for containerized deployment)
- A SUI wallet (Sui Wallet, Suiet, or Ethos)

## Installation

### 1. Clone and Install Dependencies

```bash
# Install root dependencies
npm install

# Install frontend dependencies
cd frontend
npm install
cd ..
```

### 2. Configure Environment Variables

```bash
# Copy the example environment file
cp .env.example .env

# Edit .env with your configuration
# VITE_SUI_NETWORK=testnet
# VITE_PACKAGE_ID=<your-package-id>
# VITE_APP_OBJECT_ID=<your-app-object-id>
```

## Development

### Build and Deploy Smart Contracts

```bash
# Navigate to the move directory
cd move

# Build the Move package
sui move build

# Run tests
sui move test

# Deploy to testnet
sui client publish --gas-budget 100000000

# Or deploy to devnet
sui client publish --gas-budget 100000000 --network devnet
```

After deployment, note down:
- **Package ID**: Use this for `VITE_PACKAGE_ID`
- **App Object ID**: The shared object ID for `VITE_APP_OBJECT_ID`

### Run Frontend Development Server

```bash
# From the root directory
npm run dev:frontend

# Or from the frontend directory
cd frontend
npm run dev
```

The application will be available at `http://localhost:5173`

### Run Full Stack Development

```bash
# From the root directory
npm run dev
```

## Building for Production

### Build Frontend

```bash
npm run build:frontend
```

### Docker Deployment

```bash
# Build and run with docker-compose
docker-compose up -d

# Stop services
docker-compose down
```

The application will be available at `http://localhost:3000`

## Smart Contract Overview

### Main Modules

#### `counter.move`

An advanced counter demonstrating SUI Move best practices:

- **Counter**: Shared object with value and owner tracking
- **OwnerCap**: Capability for admin-only operations
- **create()**: Create and share a new counter with OwnerCap
- **increment()**: Increment counter with Clock for timestamps
- **set_value()**: Owner-only function to set counter value
- **freeze_counter()**: Permanently freeze counter (requires OwnerCap)
- **Events**: EventIncrement and EventCreate for tracking changes

Features:
- Event emission with timestamps using Clock
- Owner-based access control
- Capability-based permissions with OwnerCap
- Comprehensive getter functions

#### `example.move`

A simple application template demonstrating basic SUI Move concepts:

- **App**: Shared object containing application state
- **AdminCap**: Admin capability for privileged operations
- **increment()**: Public function to increment the counter
- **update_name()**: Admin function to update app name

### Testing Smart Contracts

```bash
cd move
sui move build
sui move test
```

All tests should pass, covering:
- Counter creation
- Increment operations
- Owner-only set_value
- Unauthorized access prevention

## Frontend Architecture

### Key Technologies

- **React 18**: Modern React with hooks
- **TypeScript**: Type-safe development
- **Vite**: Fast build tool and dev server
- **TailwindCSS**: Utility-first CSS framework with dark mode
- **@mysten/dapp-kit**: SUI wallet integration (v0.19.9)
- **@mysten/sui**: SUI TypeScript SDK (v1.45.0)
- **@mysten/walrus**: Walrus decentralized storage SDK (v0.8.4)
- **@mysten/seal**: Seal protocol integration (v0.9.4)
- **Shadcn UI**: Modern, accessible UI components
- **React Spinners**: Loading indicators

### Key Components

#### Core Components
- **Providers**: Wraps app with SUI client, wallet providers, and React Query
- **App**: Main application with multi-view navigation (Counter/Walrus)
- **Config**: Network configuration for testnet, devnet, and mainnet

#### UI Components (`components/ui/`)
- **Button**: Versatile button component with variants (default, outline, destructive, ghost, link)
- **Card**: Card container with Header, Title, Description, Content, and Footer
- **Alert**: Alert component for success, error, and info messages

#### Feature Components
- **WalrusUpload**: Complete Walrus storage interface
  - File upload with drag-and-drop
  - Text content upload
  - JSON data upload with validation
  - Upload history tracking
  - Blob ID and URL management
  - Integration with WalrusCan and SuiVision explorers

### Services

#### `walrusService.ts`
Wrapper around the official @mysten/walrus SDK:
- `uploadWithFlow()`: Multi-step upload flow for browser environments
- `readBlob()`: Read blob data from Walrus
- `getFiles()`: Retrieve files by ID
- `downloadAsText()`: Download and parse as text
- `downloadAsJson()`: Download and parse as JSON

The service uses the WriteFilesFlow pattern to avoid popup blocking:
1. Encode files
2. Register blob (sign transaction)
3. Upload blob data to storage nodes
4. Certify blob (sign transaction)
5. Get blob ID for retrieval

## SUI Network Configuration

The application supports multiple SUI networks:

- **Mainnet**: Production network
- **Testnet**: Testing network (default)
- **Devnet**: Development network

Switch networks by updating `VITE_SUI_NETWORK` in your `.env` file.

## Common Commands

```bash
# Install dependencies
npm install

# Run development servers
npm run dev

# Build for production
npm run build

# Deploy to testnet
npm run deploy:testnet

# Deploy to devnet
npm run deploy:devnet

# Run with Docker
docker-compose up -d
```

## Getting Testnet SUI Tokens

To interact with the dApp on testnet, you'll need testnet SUI tokens:

```bash
# Request testnet tokens
sui client faucet

# Check your balance
sui client balance
```

Or use the [SUI Testnet Faucet](https://discord.com/channels/916379725201563759/971488439931392130) on Discord.

## Using Walrus Decentralized Storage

### What is Walrus?

Walrus is a decentralized storage network built on Sui blockchain that provides:
- **Redundant Storage**: Files stored across multiple nodes
- **Permanent Accessibility**: Content accessible via blob ID
- **Epoch-based Duration**: Storage for configurable number of epochs
- **No Central Point of Failure**: Fully decentralized architecture

### Uploading to Walrus

1. **Navigate to Walrus Storage**: Click the "Walrus Storage" button in the navigation bar
2. **Connect Wallet**: Ensure your SUI wallet is connected
3. **Choose Upload Type**:
   - **File**: Upload any file type (images, documents, etc.)
   - **Text**: Upload plain text content
   - **JSON**: Upload and validate JSON data

4. **Upload Process**:
   - Select or enter your content
   - Click upload button
   - Sign two transactions:
     - Register transaction: Creates blob metadata on-chain
     - Certify transaction: Certifies the blob after upload
   - Wait for confirmation

5. **Access Your Files**:
   - Copy Blob ID for programmatic access
   - Copy URL for direct browser access
   - View on WalrusCan explorer
   - View metadata on SuiVision

### Programmatic Walrus Usage

```typescript
import { createWalrusService } from '@/services/walrusService'

// Create Walrus service
const walrus = createWalrusService({
  network: 'testnet',
  epochs: 10
})

// Upload a file
const flow = walrus.uploadWithFlow([{
  contents: fileData,
  identifier: 'myfile.txt',
  tags: { 'content-type': 'text/plain' }
}], { epochs: 10, deletable: true })

await flow.encode()
const registerTx = flow.register({ owner: address, epochs: 10, deletable: true })
// Sign and execute registerTx
await flow.upload({ digest })
const certifyTx = flow.certify()
// Sign and execute certifyTx
const files = await flow.listFiles()
const blobId = files[0]?.blobId

// Read a file
const data = await walrus.readBlob(blobId)
```

### Walrus Storage Costs

- **Testnet**: Free for testing (get SUI from faucet)
- **Storage Duration**: 10 epochs ≈ 30 days on testnet
- **Mainnet**: Costs based on file size and epoch duration

### Walrus Resources

- [Walrus Documentation](https://docs.walrus.site/)
- [Walrus SDK](https://sdk.mystenlabs.com/walrus)
- [WalrusCan Explorer](https://walruscan.com/)
- [Walrus GitHub](https://github.com/MystenLabs/walrus-docs)

## Troubleshooting

### SUI CLI Issues

```bash
# Check SUI CLI version
sui --version

# Switch to testnet
sui client switch --env testnet

# Check active address
sui client active-address
```

### Frontend Issues

```bash
# Clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm install

# Clear Vite cache
rm -rf node_modules/.vite
```

## Project Roadmap

- [ ] Add more complex smart contract examples
- [ ] Implement token/NFT functionality
- [ ] Add transaction history
- [ ] Improve UI/UX with more components
- [ ] Add comprehensive test coverage
- [ ] Deploy to mainnet

## Resources

- [SUI Documentation](https://docs.sui.io/)
- [Move Language Book](https://move-language.github.io/move/)
- [SUI TypeScript SDK](https://sdk.mystenlabs.com/typescript)
- [Mysten dApp Kit](https://sdk.mystenlabs.com/dapp-kit)

## License

MIT

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## Support

For questions and support, please open an issue in the repository.

---

Built with ❤️ for SUI Hackathon
