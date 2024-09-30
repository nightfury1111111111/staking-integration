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
import { IDL } from "../target/types/token_lock";
import { SplTokenStaking } from "../target/types/spl_token_staking";
import { TOKEN_PROGRAM_ID, getMint } from "@solana/spl-token";
import {
  assertBNEqual,
  assertKeyDefault,
  assertKeysEqual,
} from "./genericTests";
import { getNextUnusedStakeReceiptNonce } from "./util";
import { constants } from "./constants";

export function wait(milliseconds: number) {
  return new Promise((resolve) => {
    setTimeout(resolve, milliseconds);
  });
}

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
  tokenLockProgramId,
  tokenRecipient,
  startTime,
  totalAmount,
  totalPeriod,
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
const program = new anchor.Program(IDL, tokenLockProgramId, provider);

const addRewardPool = async () => {
  if (!program.provider.publicKey) return;

  // Determined Seeds
  const adminSeed = "admin";
  const stateSeed = "state";

  const adminKey = PublicKey.findProgramAddressSync(
    [
      Buffer.from(anchor.utils.bytes.utf8.encode(stateSeed)),
      Buffer.from(anchor.utils.bytes.utf8.encode(adminSeed)),
    ],
    program.programId
  )[0];

  const vault = PublicKey.findProgramAddressSync(
    [Buffer.from("vault"), mintToBeStaked.toBuffer()],
    program.programId
  )[0];

  await program.methods
    .initAdmin(startTime, totalPeriod, totalAmount)
    .accounts({
      admin: wallet.publicKey.toString(),
      adminState: adminKey.toString(),
      tokenMint: mintToBeStaked,
      tokenRecipient,
      vault,
      systemProgram: anchor.web3.SystemProgram.programId,
      rent: anchor.web3.SYSVAR_RENT_PUBKEY,
      tokenProgram: TOKEN_PROGRAM_ID,
    })
    .signers([wallet.payer])
    .rpc();
  await wait(500);
  const fetchedAdminState: any = await program.account.adminState.fetch(
    adminKey
  );
  console.log({ fetchedAdminState, vault });
};

addRewardPool();
