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
  stakeTokenName,
  stakeTokenSymbol,
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

const updateTokenMetadata = async () => {
  if (!program.provider.publicKey) return;
  const umi = createUmi(provider.connection.rpcEndpoint, "processed").use(
    mplTokenMetadata()
  );
  let metadataPda: Pda;

  const [stakePoolKey] = anchor.web3.PublicKey.findProgramAddressSync(
    [
      new anchor.BN(nonce).toArrayLike(Buffer, "le", 1),
      mintToBeStaked.toBuffer(),
      program.provider.publicKey.toBuffer(),
      Buffer.from("stakePool", "utf-8"),
    ],
    program.programId
  );

  let stakePool = await program.account.stakePool.fetch(stakePoolKey);
  console.log(stakePool);

  metadataPda = findMetadataPda(umi, {
    mint: publicKey(stakePool.stakeMint),
  });

  try {
    await program.methods
      .updateTokenMeta(stakeTokenName, stakeTokenSymbol, "")
      .accounts({
        authority: provider.publicKey,
        metadataAccount: metadataPda[0],
        stakePool: stakePoolKey,
        stakeMint: stakePool.stakeMint,
        metadataProgram: METADATA_PROGRAM_KEY,
        rent: anchor.web3.SYSVAR_RENT_PUBKEY,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .rpc();
  } catch (err) {
    console.error(err);
  }

  const metadataAfter = await fetchMetadata(umi, metadataPda);
  console.log(metadataAfter);
};

updateTokenMetadata();
