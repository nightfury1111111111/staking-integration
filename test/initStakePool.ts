import * as anchor from "@coral-xyz/anchor";
import { Connection, Commitment } from "@solana/web3.js";
import NodeWallet from "@coral-xyz/anchor/dist/cjs/nodewallet";
import { IDL } from "../target/types/spl_token_staking";
import { getMint } from "@solana/spl-token";
import { constants } from "./constants";
import { wait } from "./initLockContract";

const {
  SCALE_FACTOR_BASE,
  mintToBeStaked,
  SPL_TOKEN_PROGRAM_ID,
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

const initStakePool = async () => {
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
  const [stakeMintKey] = anchor.web3.PublicKey.findProgramAddressSync(
    [stakePoolKey.toBuffer(), Buffer.from("stakeMint", "utf-8")],
    program.programId
  );
  const [vaultKey] = anchor.web3.PublicKey.findProgramAddressSync(
    [stakePoolKey.toBuffer(), Buffer.from("vault", "utf-8")],
    program.programId
  );

  await program.methods
    .initializeStakePool(nonce, maxWeight, minDuration, maxDuration)
    .accounts({
      payer: provider.publicKey,
      authority: provider.publicKey,
      stakePool: stakePoolKey,
      stakeMint: stakeMintKey,
      mint: mintToBeStaked,
      vault: vaultKey,
      tokenProgram: SPL_TOKEN_PROGRAM_ID,
      rent: anchor.web3.SYSVAR_RENT_PUBKEY,
      systemProgram: anchor.web3.SystemProgram.programId,
    })
    .rpc();

  // wait(4000);
  const [stakeMintAccount, vault] = await Promise.all([
    getMint(program.provider.connection, stakeMintKey),
    // tokenProgramInstance.account.account.fetch(vaultKey),
    program.account.stakePool.fetch(stakePoolKey),
  ]);

  console.log({ stakeMintAccount, vault });
};

initStakePool();
