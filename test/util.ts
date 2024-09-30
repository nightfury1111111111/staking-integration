import * as anchor from "@coral-xyz/anchor";

export const getNextUnusedStakeReceiptNonce = async (
  connection: anchor.web3.Connection,
  programId: anchor.web3.PublicKey,
  owner: anchor.web3.PublicKey,
  stakePoolKey: anchor.web3.PublicKey
) => {
  const pageSize = 10;
  const maxIndex = 4_294_967_295;
  const maxPage = Math.ceil(maxIndex / pageSize);
  for (let page = 0; page <= maxPage; page++) {
    const startIndex = page * pageSize;
    const stakeReceiptKeys: anchor.web3.PublicKey[] = [];
    // derive keys for batch
    for (let i = startIndex; i < startIndex + pageSize; i++) {
      const [stakeReceiptKey] = anchor.web3.PublicKey.findProgramAddressSync(
        [
          owner.toBuffer(),
          stakePoolKey.toBuffer(),
          new anchor.BN(i).toArrayLike(Buffer, "le", 4),
          Buffer.from("stakeDepositReceipt", "utf-8"),
        ],
        programId
      );
      stakeReceiptKeys.push(stakeReceiptKey);
    }
    // fetch page of AccountInfo for stake receipts
    const accounts = await connection.getMultipleAccountsInfo(stakeReceiptKeys);
    const indexWithinPage = accounts.findIndex((a) => !a);
    if (indexWithinPage > -1) {
      return startIndex + indexWithinPage;
    }
  }
  throw new Error("No more nonces available");
};
