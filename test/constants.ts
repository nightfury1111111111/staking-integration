import * as anchor from "@coral-xyz/anchor";
import {
  PublicKey,
  SystemProgram,
  Transaction,
  Connection,
  Commitment,
} from "@solana/web3.js";

export const constants = {
  rpcEndpoint: "https://api.devnet.solana.com", // solana rpc endpoint
  SCALE_FACTOR_BASE: 1000000000, // don't need to update
  maxWeightScale: 1, // don't need to update - used for different lock period to determine stake weight
  SPL_TOKEN_PROGRAM_ID: new anchor.web3.PublicKey(
    "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"
  ), // don't need to update
  METADATA_PROGRAM_KEY: new anchor.web3.PublicKey(
    "metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s"
  ), // don't need to update
  mintToBeStaked: new PublicKey("ErNQeVLdwxNrPXNT1FChKHfebMebSDYmNqw2yTfP35En"), // token address for staking
  nonce: 32, // unique number for each stake pool
  minDuration: new anchor.BN(300), // min duration time of stake - don't use for fixed staking
  maxDuration: new anchor.BN(31536000), // max duration time of stake - don't use for fixed staking
  signerKeypair: anchor.web3.Keypair.fromSecretKey(
    new Uint8Array([
      209, 62, 43, 248, 235, 142, 221, 23, 139, 227, 49, 32, 232, 21, 44, 11,
      226, 102, 185, 162, 114, 253, 215, 76, 26, 62, 241, 96, 82, 144, 255, 50,
      57, 174, 4, 42, 37, 200, 18, 118, 90, 250, 180, 1, 78, 140, 179, 105, 48,
      176, 176, 40, 248, 119, 107, 174, 9, 62, 189, 33, 178, 91, 201, 175,
    ])
  ), // private key of admin wallet
  programId: new PublicKey("E1iKYDRxm1reD3CaJpaCxWG26QNvd2FWdG7p8HoxQCxt"), // programid of statking contract - can get using *anchor keys list*
  tokenLockProgramId: new PublicKey(
    "5YFYMJ6zQyNzWDxXyDtA2nfJrPXnQRUaWkVyuAYencLw"
  ), // program id of token lock contract
  stakeTokenName: "Staking Test DACAPEL Token", // staking contract sends stake tokens to stakers - the name of this token
  stakeTokenSymbol: "DACAPEL", // staking contract sends stake tokens to stakers - the symbol of this token
  tokenRecipient: new PublicKey("2PQdqwMoV6y2gU3u9ijVhTtf4t4XsBEM4JvwHbwjqhaQ"), // address the reward tokens will be sent - need to get from stakepoolinfo - first reward vault key
  startTime: new anchor.BN(1726638815), // start time of staking - need to calculate by second not milisecond
  totalPeriod: new anchor.BN(3600 * 24 * 365), // total staking period
  totalAmount: new anchor.BN(10000000000000), // total staking reward amount - need to consider decimal
};
