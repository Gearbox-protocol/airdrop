# Gearbox Rewards

GEAR tokens were awarded over multiple community distribution stages, each with their own rules and amounts. The early stages of testers and Discord participants can be found in the [general docs](https://docs.gearbox.finance/overview/launch-phases). Other stages and GEAR distirbution have been attributed to retroactive and ongoing [Liquidity Mining](https://gov.gearbox.fi/t/gip-22-gearbox-v2-liquidity-mining-programs/1550), those details can be seen here. [GEAR](https://docs.gearbox.finance/gear-token/gear-overview) information is also accessible in docs.

## How to install

1. Clone the repository: `git clone git@github.com:Gearbox-protocol/rewards.git`
2. `cd rewards`
3. Build: `yarn && yarn build-contract`
4. Rename `.env.example` and fill all settings:

| Setting              | Value                 |
| -------------------- | --------------------- |
| ETH_MAINNET_PROVIDER | RPC for mainnet calls |
| ETH_GOERLI_PROVIDER  | RPC for goerli calls  |

## How to update merkle tree

1. Run `yarn update` for mainnet or `yarn update-goerli` for goerli
2. The script creates json file and csv with updated data in `merkle` folder
3. Push new files into repository
