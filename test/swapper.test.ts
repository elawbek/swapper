import { expect } from "chai";
import { ethers } from "hardhat";
import {
  impersonateAccount,
  time,
  loadFixture,
} from "@nomicfoundation/hardhat-network-helpers";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";

import { solidityPack, parseEther } from "ethers/lib/utils";

import snapshotGasCost from "./snapshots";
import { WETH, WETH_WAHLE, pairs, tokens, UNI_ROUTER } from "./helper";

import {
  IERC20Metadata__factory,
  IERC20,
  IERC20__factory,
  IRouter,
  IRouter__factory,
  IUniswapV2Pair__factory,
  IUniswapV2Pair,
} from "../typechain-types";

// solc --strict-assembly --optimize --optimize-runs 1000 contracts/Swapper.yul
const bytecode =
  "6101718061004d343933346009015273c02aaa39b223fe8d0a0e5c4f27ead9083c756cc23481816061015260bc01527370997970c51812dc3a010c7d01b50e0d17dc79c83461010a015234f3fe3d341161014957337f000000000000000000000000000000000000000000000000000000000000000014610030575b005b368060351461008b57600e1461004257005b63a9059cbb60e01b3490815233600452803560901c60245280604481807f00000000000000000000000000000000000000000000000000000000000000005af161002e575b3434fd5b5042343560e01c106100875760043560601c63a9059cbb60e01b34528060045260183560901c6024523434604434347f00000000000000000000000000000000000000000000000000000000000000005af1156100875763022c0d9f60e01b345261010534603435116100fd8161014d565b60045261015f565b6024527f0000000000000000000000000000000000000000000000000000000000000000604452608060645234608452349060a43491349034905af161002e573434fd5b3d3dfd5b15610156573490565b60263560901c90565b1561016d5760263560901c90565b349056";

async function deployFixture() {
  const [owner, alice] = await ethers.getSigners();

  await impersonateAccount(WETH_WAHLE);
  const whale = await ethers.getSigner(WETH_WAHLE);

  const weth = IERC20__factory.connect(WETH, owner);
  const token = IERC20__factory.connect(tokens[0], owner);
  const router = IRouter__factory.connect(UNI_ROUTER, owner);
  const pairForTest = IUniswapV2Pair__factory.connect(pairs[0], owner);

  const ContrFactory = new ethers.ContractFactory([], bytecode, owner);
  const swapYulContract = await ContrFactory.deploy();

  return {
    owner,
    alice,
    token,
    weth,
    router,
    pairForTest,
    swapYulContract,
    whale,
  };
}

// hh node
// rm -rf test/__* && hh test test/swapper.test.ts --network localhost
describe("", () => {
  let owner: SignerWithAddress;
  let alice: SignerWithAddress;
  let whale: SignerWithAddress;

  let token: IERC20;
  let weth: IERC20;
  let router: IRouter;
  let pairForTest: IUniswapV2Pair;

  let swapYulContract: any;

  beforeEach(async () => {
    ({
      alice,
      owner,
      weth,
      token,
      router,
      pairForTest,
      swapYulContract,
      whale,
    } = await loadFixture(deployFixture));
  });

  xit("test swap", async () => {
    const amountsOut = await router.getAmountsOut(parseEther("0.1"), [
      WETH,
      token.address,
    ]);

    await weth
      .connect(whale)
      .transfer(swapYulContract.address, parseEther("0.1"));

    const deadline = (await time.latest()) + 1200;

    const data = solidityPack(
      ["uint32", "address", "uint112", "uint112", "bool"],
      [
        deadline,
        pairForTest.address,
        amountsOut[0],
        amountsOut[1],
        (await pairForTest.token0()) === WETH,
      ]
    );

    await expect(() =>
      owner.sendTransaction({
        to: swapYulContract.address,
        data,
        gasLimit: 200000,
        accessList: [
          [
            pairForTest.address,
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
      })
    ).to.changeTokenBalance(token, alice, amountsOut[1]);
  });

  xit("withdraw test", async () => {
    weth.connect(whale).transfer(swapYulContract.address, 100);

    const withdrawData = solidityPack(["uint112"], [100]);

    await expect(() =>
      owner.sendTransaction({
        to: swapYulContract.address,
        data: withdrawData,
      })
    ).to.changeTokenBalance(weth, owner, 100);
  });

  xit("test gas deploy", async () => {
    const ContrFactory = new ethers.ContractFactory([], bytecode, owner);
    await snapshotGasCost(ContrFactory.deploy());
  });

  it("test gas swaps", async () => {
    await snapshotGasCost(
      weth.connect(whale).transfer(swapYulContract.address, 1)
    );

    for (let i = 0; i < tokens.length; i++) {
      const token = IERC20Metadata__factory.connect(tokens[i], owner);
      const wethMeta = IERC20Metadata__factory.connect(WETH, owner);

      console.log(`Pair: ${await wethMeta.name()} - ${await token.name()}`);
      console.log(`Pair: ${await wethMeta.symbol()} - ${await token.symbol()}`);

      const pair = IUniswapV2Pair__factory.connect(pairs[i], owner);
      console.log(await pair.token1());

      await snapshotGasCost(
        weth.connect(whale).transfer(swapYulContract.address, parseEther("0.1"))
      );

      const deadline = (await time.latest()) + 1200;

      let amountsOut = await router.getAmountsOut(parseEther("0.1"), [
        WETH,
        tokens[i],
      ]);
      const token0 = (await pair.token0()) === weth.address;

      let data = solidityPack(
        ["uint32", "address", "uint112", "uint112", "bool"],
        [deadline, pair.address, amountsOut[0], amountsOut[1], token0]
      );

      await snapshotGasCost(
        owner.sendTransaction({
          to: swapYulContract.address,
          data,
          gasLimit: 200000,
          accessList: [
            [
              pair.address,
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
        })
      );

      console.log("swap 2\n");

      await snapshotGasCost(
        weth.connect(whale).transfer(swapYulContract.address, parseEther("0.1"))
      );

      amountsOut = await router.getAmountsOut(parseEther("0.1"), [
        WETH,
        tokens[i],
      ]);

      data = solidityPack(
        ["uint32", "address", "uint112", "uint112", "bool"],
        [deadline, pair.address, amountsOut[0], amountsOut[1], token0]
      );

      await snapshotGasCost(
        owner.sendTransaction({
          to: swapYulContract.address,
          data,
          gasLimit: 200000,
          accessList: [
            [
              pair.address,
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
        })
      );
    }
  }).timeout(2000000);
});
