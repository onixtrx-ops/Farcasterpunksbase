import { NextResponse } from "next/server";
import crypto from "crypto";
import { ethers } from "ethers";

const {
  RELAYER_PRIVATE_KEY,
  BASE_RPC_URL,
  WEBHOOK_SECRET,
  SEADROP_ADDRESS = "0x00005EA00Ac477B1030CE78506496e8C2dE24bf5",
  NFT_CONTRACT = "0x4d749dc4016936759e437b1a01d2ef0f0690e651",
  OPTIONAL_MAX_PER_TX = "3"
} = process.env;

const SEADROP_ABI = [
  "function getPublicDrop(address nftContract) external view returns (uint80 mintPrice, uint48 startTime, uint48 endTime, uint16 maxTotalMintableByWallet, uint16 feeBps, bool restrictFeeRecipients)",
  "function getAllowedFeeRecipients(address nftContract) external view returns (address[] memory)",
  "function getFeeRecipients(address nftContract) external view returns (address[] memory)",
  "function mintPublic(address nftContract, address feeRecipient, address minterIfNotPayer, uint256 quantity) external payable"
];

function verifyHmac(raw: string, signatureHeader?: string) {
  if (!WEBHOOK_SECRET) return false;
  const h = crypto.createHmac("sha256", WEBHOOK_SECRET);
  h.update(raw);
  const digest = h.digest("hex");
  const sigNormalized = (signatureHeader || "").replace(/^sha256=/i, "");
  try {
    return crypto.timingSafeEqual(Buffer.from(digest, "hex"), Buffer.from(sigNormalized, "hex"));
  } catch (e) {
    return false;
  }
}

export async function POST(request: Request) {
  try {
    const raw = await request.text();
    const signatureHeader = request.headers.get("x-webhook-signature") || request.headers.get("x-signature") || "";

    if (!verifyHmac(raw, signatureHeader)) {
      return NextResponse.json({ error: "Invalid webhook signature" }, { status: 401 });
    }

    const body = JSON.parse(raw || "{}");
    const minter = body.minter;
    const qty = Math.max(1, Math.min(Number(OPTIONAL_MAX_PER_TX || 3), Number(body.quantity || 1)));

    if (!minter || !ethers.isAddress(minter)) {
      return NextResponse.json({ error: "Invalid minter address" }, { status: 400 });
    }
    if (!RELAYER_PRIVATE_KEY || !BASE_RPC_URL) {
      return NextResponse.json({ error: "Server not configured" }, { status: 500 });
    }

    const provider = new ethers.JsonRpcProvider(BASE_RPC_URL);
    const wallet = new ethers.Wallet(RELAYER_PRIVATE_KEY, provider);

    const seadropRead = new ethers.Contract(SEADROP_ADDRESS, SEADROP_ABI, provider);
    const publicDrop = await seadropRead.getPublicDrop(NFT_CONTRACT);
    const mintPriceWei = BigInt(publicDrop[0].toString ? publicDrop[0].toString() : publicDrop[0]);
    const restrict = Boolean(publicDrop[5]);

    let feeRecipient = ethers.ZeroAddress;
    if (restrict) {
      try {
        let recips = [];
        try { recips = await seadropRead.getAllowedFeeRecipients(NFT_CONTRACT); } catch(_) {
          recips = await seadropRead.getFeeRecipients(NFT_CONTRACT);
        }
        if (recips && recips.length > 0) feeRecipient = recips[0];
      } catch (e) {
        feeRecipient = ethers.ZeroAddress;
      }
    }

    const total = mintPriceWei * BigInt(qty);
    const bal = BigInt((await provider.getBalance(wallet.address)).toString());
    if (bal < total) {
      return NextResponse.json({ error: "Relayer has insufficient balance", relayerBalance: bal.toString(), required: total.toString() }, { status: 402 });
    }

    const seadropWithSigner = new ethers.Contract(SEADROP_ADDRESS, SEADROP_ABI, wallet);
    const tx = await seadropWithSigner.mintPublic(NFT_CONTRACT, feeRecipient, minter, qty, { value: total });
    const receipt = await tx.wait(1);

    return NextResponse.json({ status: "ok", txHash: tx.hash, receipt, mintedTo: minter, qty });
  } catch (err) {
    const message = err?.message || String(err);
    console.error("mint route error:", message);
    return NextResponse.json({ error: "Mint failed", details: message }, { status: 500 });
  }
}
