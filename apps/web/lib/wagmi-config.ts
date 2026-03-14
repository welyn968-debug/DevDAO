import { createConfig, http } from "wagmi";
import { polygon, polygonAmoy } from "wagmi/chains";
import { injected, walletConnect } from "wagmi/connectors";

const alchemyKey = process.env.NEXT_PUBLIC_ALCHEMY_API_KEY;
const wcId = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || "demo";
const chain = (process.env.NEXT_PUBLIC_CHAIN_ID === "137" ? polygon : polygonAmoy);

export const wagmiConfig = createConfig({
  chains: [polygonAmoy, polygon],
  transports: {
    [polygon.id]: http(`https://polygon-mainnet.g.alchemy.com/v2/${alchemyKey}`),
    [polygonAmoy.id]: http(`https://polygon-amoy.g.alchemy.com/v2/${alchemyKey}`)
  },
  connectors: [injected({}), walletConnect({ projectId: wcId })]
});
