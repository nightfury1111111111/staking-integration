import * as anchor from "@coral-xyz/anchor";
import { splTokenProgram } from "@project-serum/spl-token";
import {
  PublicKey,
  SystemProgram,
  Transaction,
  Connection,
  Commitment,
} from "@solana/web3.js";
import {
  getAssociatedTokenAddressSync,
  createTransferInstruction,
  createAssociatedTokenAccountInstruction,
} from "@solana/spl-token";
import {
  fetchMetadata,
  findMetadataPda,
  mplTokenMetadata,
} from "@metaplex-foundation/mpl-token-metadata";
import { createUmi } from "@metaplex-foundation/umi-bundle-defaults";
import { Pda, publicKey } from "@metaplex-foundation/umi";
import NodeWallet from "@coral-xyz/anchor/dist/cjs/nodewallet";
import { IDL } from "../target/types/spl_token_staking";
import { SplTokenStaking } from "../target/types/spl_token_staking";
import { TOKEN_PROGRAM_ID, getMint } from "@solana/spl-token";
import {
  assertBNEqual,
  assertKeyDefault,
  assertKeysEqual,
} from "./genericTests";
import { getNextUnusedStakeReceiptNonce } from "./util";
import { constants } from "./constants";
import { wait } from "./initLockContract";

const {
  SCALE_FACTOR_BASE,
  mintToBeStaked,
  SPL_TOKEN_PROGRAM_ID,
  METADATA_PROGRAM_KEY,
  nonce,
  minDuration,
  maxDuration,
  maxWeightScale,
  rpcEndpoint,
  signerKeypair,
  programId,
} = constants;

const maxWeight = new anchor.BN(
  maxWeightScale * parseInt(SCALE_FACTOR_BASE.toString())
);

const commitment: Commitment = "confirmed";
const connection = new Connection(rpcEndpoint, {
  commitment,
  // wsEndpoint: "wss://api.devnet.solana.com/",
});
const options = anchor.AnchorProvider.defaultOptions();

const wallet = new NodeWallet(signerKeypair);

const provider = new anchor.AnchorProvider(connection, wallet, options);

anchor.setProvider(provider);

// CAUTTION: if you are intended to use the program that is deployed by yourself,
// please make sure that the programIDs are consistent
const program = new anchor.Program(IDL, programId, provider);

const addRewardPool = async () => {
  if (!program.provider.publicKey) return;

  const [stakePoolKey] = anchor.web3.PublicKey.findProgramAddressSync(
    [
      new anchor.BN(nonce).toArrayLike(Buffer, "le", 1),
      mintToBeStaked.toBuffer(),
      program.provider.publicKey.toBuffer(),
      Buffer.from("stakePool", "utf-8"),
    ],
    program.programId
  );
  const [rewardVaultKey] = anchor.web3.PublicKey.findProgramAddressSync(
    [
      stakePoolKey.toBuffer(),
      mintToBeStaked.toBuffer(), // reward token is the same as stake token
      Buffer.from("rewardVault", "utf-8"),
    ],
    program.programId
  );
  const rewardPoolIndex = 0;
  await program.methods
    .addRewardPool(rewardPoolIndex)
    .accounts({
      authority: program.provider.publicKey,
      rewardMint: mintToBeStaked,
      stakePool: stakePoolKey,
      rewardVault: rewardVaultKey,
      tokenProgram: TOKEN_PROGRAM_ID,
      rent: anchor.web3.SYSVAR_RENT_PUBKEY,
      systemProgram: anchor.web3.SystemProgram.programId,
    })
    .rpc();
  const [stakePool] = await Promise.all([
    program.account.stakePool.fetch(stakePoolKey),
  ]);
  console.log(stakePool);
};

addRewardPool();
