import {createAppKit} from '@reown/appkit/react'
import {EthersAdapter} from '@reown/appkit-adapter-ethers'
import {baseSepolia, base} from '@reown/appkit/networks'

const projectId = import.meta.env.VITE_WALLET_CONNECT_PROJECT_ID

if (!projectId) {
    throw new Error('VITE_WALLET_CONNECT_PROJECT_ID is not defined in your .env file');
}

const chainEnv = import.meta.env.VITE_CHAIN || 'baseSepolia';
export const activeNetwork = chainEnv === 'base' ? base : baseSepolia;
export const networks = [activeNetwork];
const metadata = {
    name: 'One Soul Many Ships',
    description: 'Web3 Space Shooter',
    url: 'https://onesoulmanyships.xyz',
    icons: ['https://avatars.mywebsite.com/']
}

export const appKit = createAppKit({
    adapters: [new EthersAdapter()],
    networks,
    metadata,
    projectId,
    defaultNetwork: activeNetwork,
    features: {
        analytics: true,
        email: false,
        socials: false
    },
    themeMode: 'dark',
    themeVariables: {
        '--w3m-accent': '#FEBA00',
        '--w3m-border-radius-master': '2px'
    }
})