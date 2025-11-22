import { ConnectButton, useCurrentAccount, useSignAndExecuteTransaction, useSuiClient } from '@mysten/dapp-kit'
import { Transaction } from '@mysten/sui/transactions'
import { useEffect, useState } from 'react'
import toast, { Toaster } from 'react-hot-toast'
import { WalrusUpload } from './components/WalrusUpload'
import { LemanFlowDashboard } from './pages/LemanFlowDashboard'

const PACKAGE_ID = import.meta.env.VITE_PACKAGE_ID || '0x...'
const APP_OBJECT_ID = import.meta.env.VITE_APP_OBJECT_ID || '0x...'

type View = 'counter' | 'walrus' | 'lemanflow'

function App() {
  const [currentView, setCurrentView] = useState<View>('counter')
  const account = useCurrentAccount()
  const client = useSuiClient()
  const { mutate: signAndExecute } = useSignAndExecuteTransaction()
  const [counter, setCounter] = useState<number>(0)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (APP_OBJECT_ID && APP_OBJECT_ID !== '0x...') {
      fetchCounter()
    }
  }, [])

  const fetchCounter = async () => {
    try {
      const object = await client.getObject({
        id: APP_OBJECT_ID,
        options: { showContent: true },
      })

      if (object.data?.content && 'fields' in object.data.content) {
        const fields = object.data.content.fields as any
        setCounter(Number(fields.counter))
      }
    } catch (error) {
      console.error('Error fetching counter:', error)
    }
  }

  const handleIncrement = async () => {
    if (!account) {
      toast.error('Please connect your wallet first')
      return
    }

    setLoading(true)
    const tx = new Transaction()

    tx.moveCall({
      target: `${PACKAGE_ID}::example::increment`,
      arguments: [tx.object(APP_OBJECT_ID)],
    })

    signAndExecute(
      {
        transaction: tx,
      },
      {
        onSuccess: async () => {
          toast.success('Transaction successful!')
          await new Promise(resolve => setTimeout(resolve, 2000))
          await fetchCounter()
          setLoading(false)
        },
        onError: (error) => {
          toast.error(`Transaction failed: ${error.message}`)
          setLoading(false)
        },
      }
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      <Toaster position="top-right" />

      <nav className="bg-white dark:bg-gray-800 shadow-lg">
        <div className="container mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">
              🌊 LémanFlow - SUI Hackathon
            </h1>
            <div className="flex items-center gap-4">
              <div className="flex gap-2">
                <button
                  onClick={() => setCurrentView('lemanflow')}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                    currentView === 'lemanflow'
                      ? 'bg-indigo-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300'
                  }`}
                >
                  LémanFlow
                </button>
                <button
                  onClick={() => setCurrentView('counter')}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                    currentView === 'counter'
                      ? 'bg-indigo-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300'
                  }`}
                >
                  Counter
                </button>
                <button
                  onClick={() => setCurrentView('walrus')}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                    currentView === 'walrus'
                      ? 'bg-indigo-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300'
                  }`}
                >
                  Walrus Storage
                </button>
              </div>
              <ConnectButton />
            </div>
          </div>
        </div>
      </nav>

      <main className="container mx-auto px-4 py-16">
        {currentView === 'lemanflow' ? (
          <LemanFlowDashboard />
        ) : currentView === 'walrus' ? (
          <WalrusUpload />
        ) : (
        <div className="max-w-2xl mx-auto">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8">
            <div className="text-center mb-8">
              <h2 className="text-4xl font-bold mb-4 text-gray-800 dark:text-white">
                Counter dApp
              </h2>
              <p className="text-gray-600 dark:text-gray-300">
                A simple counter built on SUI blockchain
              </p>
            </div>

            <div className="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-xl p-8 text-white mb-8">
              <div className="text-center">
                <p className="text-lg mb-2 opacity-90">Current Count</p>
                <p className="text-6xl font-bold">{counter}</p>
              </div>
            </div>

            <div className="space-y-4">
              <button
                onClick={handleIncrement}
                disabled={!account || loading}
                className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-400 text-white font-semibold py-4 px-6 rounded-lg transition-colors duration-200 text-lg"
              >
                {loading ? 'Processing...' : account ? 'Increment Counter' : 'Connect Wallet First'}
              </button>

              {account && (
                <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                  <p className="text-sm text-gray-600 dark:text-gray-300">
                    Connected: {account.address.slice(0, 6)}...{account.address.slice(-4)}
                  </p>
                </div>
              )}
            </div>

            {(!PACKAGE_ID || PACKAGE_ID === '0x...') && (
              <div className="mt-6 bg-yellow-50 dark:bg-yellow-900/30 border border-yellow-200 dark:border-yellow-700 rounded-lg p-4">
                <p className="text-sm text-yellow-800 dark:text-yellow-200">
                  Please deploy your smart contract and update the environment variables
                </p>
              </div>
            )}
          </div>

          <div className="mt-8 bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8">
            <h3 className="text-xl font-bold mb-4 text-gray-800 dark:text-white">
              Getting Started
            </h3>
            <ol className="space-y-3 text-gray-600 dark:text-gray-300">
              <li className="flex items-start">
                <span className="bg-indigo-600 text-white rounded-full w-6 h-6 flex items-center justify-center mr-3 mt-0.5 flex-shrink-0">
                  1
                </span>
                <span>Connect your SUI wallet using the button above</span>
              </li>
              <li className="flex items-start">
                <span className="bg-indigo-600 text-white rounded-full w-6 h-6 flex items-center justify-center mr-3 mt-0.5 flex-shrink-0">
                  2
                </span>
                <span>Click "Increment Counter" to increase the count</span>
              </li>
              <li className="flex items-start">
                <span className="bg-indigo-600 text-white rounded-full w-6 h-6 flex items-center justify-center mr-3 mt-0.5 flex-shrink-0">
                  3
                </span>
                <span>Watch the counter update on the blockchain!</span>
              </li>
            </ol>
          </div>
        </div>
        )}
      </main>
    </div>
  )
}

export default App
