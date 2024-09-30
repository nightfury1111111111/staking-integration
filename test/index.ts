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

const SCALE_FACTOR_BASE = 1000000000;
const mintToBeStaked = new PublicKey(
  "ErNQeVLdwxNrPXNT1FChKHfebMebSDYmNqw2yTfP35En"
);
const SPL_TOKEN_PROGRAM_ID = new anchor.web3.PublicKey(
  "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"
);
const METADATA_PROGRAM_KEY = new anchor.web3.PublicKey(
  "metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s"
);
const nonce = 7;
const deposit1Amount = new anchor.BN(5_000_000_000);
const deposit2Amount = new anchor.BN(1_000_000_000);
const minDuration = new anchor.BN(300);
const maxDuration = new anchor.BN(31536000);

const baseWeight = new anchor.BN(SCALE_FACTOR_BASE.toString());
const maxWeight = new anchor.BN(SCALE_FACTOR_BASE.toString());
// const maxWeight = new anchor.BN(4 * parseInt(SCALE_FACTOR_BASE.toString()));

const commitment: Commitment = "confirmed";
const connection = new Connection("https://api.devnet.solana.com", {
  commitment,
  // wsEndpoint: "wss://api.devnet.solana.com/",
});
const options = anchor.AnchorProvider.defaultOptions();
const signerKeypair = anchor.web3.Keypair.fromSecretKey(
  new Uint8Array([
    209, 62, 43, 248, 235, 142, 221, 23, 139, 227, 49, 32, 232, 21, 44, 11, 226,
    102, 185, 162, 114, 253, 215, 76, 26, 62, 241, 96, 82, 144, 255, 50, 57,
    174, 4, 42, 37, 200, 18, 118, 90, 250, 180, 1, 78, 140, 179, 105, 48, 176,
    176, 40, 248, 119, 107, 174, 9, 62, 189, 33, 178, 91, 201, 175,
  ])
);
const wallet = new NodeWallet(signerKeypair);
const depositor = anchor.web3.Keypair.fromSecretKey(
  new Uint8Array([
    209, 62, 43, 248, 235, 142, 221, 23, 139, 227, 49, 32, 232, 21, 44, 11, 226,
    102, 185, 162, 114, 253, 215, 76, 26, 62, 241, 96, 82, 144, 255, 50, 57,
    174, 4, 42, 37, 200, 18, 118, 90, 250, 180, 1, 78, 140, 179, 105, 48, 176,
    176, 40, 248, 119, 107, 174, 9, 62, 189, 33, 178, 91, 201, 175,
  ])
);
const provider = new anchor.AnchorProvider(connection, wallet, options);

anchor.setProvider(provider);

// CAUTTION: if you are intended to use the program that is deployed by yourself,
// please make sure that the programIDs are consistent
const programId = new PublicKey("E1iKYDRxm1reD3CaJpaCxWG26QNvd2FWdG7p8HoxQCxt");
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
  const [stakeMintAccount, vault] = await Promise.all([
    getMint(program.provider.connection, stakeMintKey),
    // tokenProgramInstance.account.account.fetch(vaultKey),
    program.account.stakePool.fetch(stakePoolKey),
  ]);

  console.log({ stakeMintAccount, vault });
};

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

const updateTokenMetadata = async () => {
  if (!program.provider.publicKey) return;
  const symbol = "DACAPEL";
  const name = "Staking Test DACAPEL Token";
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
  const [rewardVaultKey] = anchor.web3.PublicKey.findProgramAddressSync(
    [
      stakePoolKey.toBuffer(),
      mintToBeStaked.toBuffer(), // reward token is the same as stake token
      Buffer.from("rewardVault", "utf-8"),
    ],
    program.programId
  );

  const rewardPoolIndex = 0;

  let stakePool = await program.account.stakePool.fetch(stakePoolKey);
  console.log(stakePool.stakeMint);

  metadataPda = findMetadataPda(umi, {
    mint: publicKey(stakePool.stakeMint),
  });

  try {
    await program.methods
      .updateTokenMeta(name, symbol, "")
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

const deposit = async () => {
  if (!program.provider.publicKey || !program.provider) return;

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

  const nextNonce = await getNextUnusedStakeReceiptNonce(
    program.provider.connection,
    program.programId,
    depositor.publicKey,
    stakePoolKey
  );

  console.log({ nextNonce });

  const [stakeReceiptKey] = anchor.web3.PublicKey.findProgramAddressSync(
    [
      depositor.publicKey.toBuffer(),
      stakePoolKey.toBuffer(),
      new anchor.BN(nextNonce).toArrayLike(Buffer, "le", 4),
      Buffer.from("stakeDepositReceipt", "utf-8"),
    ],
    program.programId
  );

  const mintToBeStakedAccount = getAssociatedTokenAddressSync(
    mintToBeStaked,
    depositor.publicKey,
    false,
    TOKEN_PROGRAM_ID
  );

  const [vaultKey] = anchor.web3.PublicKey.findProgramAddressSync(
    [stakePoolKey.toBuffer(), Buffer.from("vault", "utf-8")],
    program.programId
  );

  const [stakeMint] = anchor.web3.PublicKey.findProgramAddressSync(
    [stakePoolKey.toBuffer(), Buffer.from("stakeMint", "utf-8")],
    program.programId
  );

  const stakeMintAccountKey = getAssociatedTokenAddressSync(
    stakeMint,
    depositor.publicKey,
    false,
    TOKEN_PROGRAM_ID
  );

  const createStakeMintAccountIx = createAssociatedTokenAccountInstruction(
    program.provider.publicKey,
    stakeMintAccountKey,
    depositor.publicKey,
    stakeMint,
    TOKEN_PROGRAM_ID
  );
  const createStakeMintAccountTx = new anchor.web3.Transaction().add(
    createStakeMintAccountIx
  );

  // await provider.connection.sendTransaction(createStakeMintAccountTx, [
  //   signerKeypair,
  // ]);

  // await program.methods
  //   .deposit(nextNonce, deposit1Amount, minDuration)
  //   .accounts({
  //     payer: depositor.publicKey,
  //     owner: depositor.publicKey,
  //     from: mintToBeStakedAccount,
  //     stakePool: stakePoolKey,
  //     vault: vaultKey,
  //     stakeMint,
  //     destination: stakeMintAccountKey,
  //     stakeDepositReceipt: stakeReceiptKey,
  //     tokenProgram: TOKEN_PROGRAM_ID,
  //     rent: anchor.web3.SYSVAR_RENT_PUBKEY,
  //     systemProgram: anchor.web3.SystemProgram.programId,
  //   })
  //   .signers([depositor])
  //   .rpc({ skipPreflight: true });

  // const [stakeReceipt] = await Promise.all([
  //   program.account.stakeDepositReceipt.fetch(stakeReceiptKey),
  // ]);

  // console.log({
  //   stakeReceipt,
  // });
};

const depositAfterAddReward = async () => {
  if (!program.provider.publicKey || !program.provider) return;

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

  const nextNonce = await getNextUnusedStakeReceiptNonce(
    program.provider.connection,
    program.programId,
    depositor.publicKey,
    stakePoolKey
  );

  console.log({ nextNonce });

  const [stakeReceiptKey] = anchor.web3.PublicKey.findProgramAddressSync(
    [
      depositor.publicKey.toBuffer(),
      stakePoolKey.toBuffer(),
      new anchor.BN(nextNonce).toArrayLike(Buffer, "le", 4),
      Buffer.from("stakeDepositReceipt", "utf-8"),
    ],
    program.programId
  );

  const mintToBeStakedAccount = getAssociatedTokenAddressSync(
    mintToBeStaked,
    depositor.publicKey,
    false,
    TOKEN_PROGRAM_ID
  );

  const [vaultKey] = anchor.web3.PublicKey.findProgramAddressSync(
    [stakePoolKey.toBuffer(), Buffer.from("vault", "utf-8")],
    program.programId
  );

  const [stakeMint] = anchor.web3.PublicKey.findProgramAddressSync(
    [stakePoolKey.toBuffer(), Buffer.from("stakeMint", "utf-8")],
    program.programId
  );

  const stakeMintAccountKey = getAssociatedTokenAddressSync(
    stakeMint,
    depositor.publicKey,
    false,
    TOKEN_PROGRAM_ID
  );

  const createStakeMintAccountIx = createAssociatedTokenAccountInstruction(
    program.provider.publicKey,
    stakeMintAccountKey,
    depositor.publicKey,
    stakeMint,
    TOKEN_PROGRAM_ID
  );

  const rewardsTransferAmount = new anchor.BN(10_000_000_000_000);
  const rewardsPerEffectiveStake = rewardsTransferAmount.div(deposit1Amount);

  const transferIx = createTransferInstruction(
    getAssociatedTokenAddressSync(mintToBeStaked, program.provider.publicKey),
    rewardVaultKey,
    program.provider.publicKey,
    rewardsTransferAmount.toNumber()
  );

  const createTransferTx = new anchor.web3.Transaction().add(transferIx);

  await provider.connection.sendTransaction(createTransferTx, [signerKeypair]);

  // await program.methods
  //   .deposit(nextNonce, deposit2Amount, minDuration)
  //   .accounts({
  //     payer: depositor.publicKey,
  //     owner: depositor.publicKey,
  //     from: mintToBeStakedAccount,
  //     stakePool: stakePoolKey,
  //     vault: vaultKey,
  //     stakeMint,
  //     destination: stakeMintAccountKey,
  //     stakeDepositReceipt: stakeReceiptKey,
  //     tokenProgram: TOKEN_PROGRAM_ID,
  //     rent: anchor.web3.SYSVAR_RENT_PUBKEY,
  //     systemProgram: anchor.web3.SystemProgram.programId,
  //   })
  //   .remainingAccounts([
  //     {
  //       pubkey: rewardVaultKey,
  //       isWritable: false,
  //       isSigner: false,
  //     },
  //   ])
  //   .signers([depositor])
  //   .rpc({ skipPreflight: true });

  // const [stakeReceipt] = await Promise.all([
  //   program.account.stakeDepositReceipt.fetch(stakeReceiptKey),
  // ]);

  // console.log({
  //   stakeReceipt,
  // });
};

initStakePool();
// addRewardPool();
// updateTokenMetadata();
// deposit();
// depositAfterAddReward();
