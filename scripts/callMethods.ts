import { providers, utils } from "ethers";

const contractAddress = "";
const provider = new providers.JsonRpcProvider();
const signer = provider.getSigner();

async function callSwap(
  pairAddress: string,
  amountIn: number, // should not be greater than the balance of the contract and 0
  amountOut: number, // should not be 0
  isToken0: boolean, // should be the result pair.token0() === "0xC02aaA39A39b223b223FE8D0A0e5C4F27eAD9083C756Cc2"
  gasLimit: number
) {
  const deadline = Math.ceil(Date.now() / 1000) + 600; // 10 mins

  const swapData = utils.solidityPack(
    ["uint32", "address", "uint112", "uint112", "bool"],
    [deadline, pairAddress, amountIn, amountOut, isToken0]
  );

  const tx = await signer.sendTransaction({
    to: contractAddress,
    data: swapData,
    gasLimit,
    accessList: [
      [
        pairAddress,
        [
          "0x0000000000000000000000000000000000000000000000000000000000000006",
          "0x0000000000000000000000000000000000000000000000000000000000000007",
          "0x0000000000000000000000000000000000000000000000000000000000000008",
          "0x0000000000000000000000000000000000000000000000000000000000000009",
          "0x000000000000000000000000000000000000000000000000000000000000000a",
          "0x000000000000000000000000000000000000000000000000000000000000000c",
        ],
      ],
    ],
  });

  await tx.wait();
}

async function callWithdraw(
  amount: number, // should not be greater than the balance of the contract and 0
  gasLimit: number
) {
  const withdrawData = utils.solidityPack(["uint112"], [amount]);

  const tx = await signer.sendTransaction({
    to: contractAddress,
    data: withdrawData,
    gasLimit,
  });

  await tx.wait();
}
