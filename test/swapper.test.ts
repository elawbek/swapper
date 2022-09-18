import { expect } from "chai";
import { ethers } from "hardhat";
import {
  impersonateAccount,
  time,
  loadFixture,
} from "@nomicfoundation/hardhat-network-helpers";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";

import { solidityPack } from "ethers/lib/utils";

import snapshotGasCost from "./snapshots";

import {
  IERC20,
  IERC20__factory,
  IRouter,
  IRouter__factory,
  IUniswapV2Pair__factory,
  IUniswapV2Pair,
} from "../typechain-types";

// solc --strict-assembly --optimize --optimize-runs 1000 contracts/Swapper.yul
const bytecode =
  "6101718061004d343933346009015273dac17f958d2ee523a2206206994597c13d831ec73481816061015260bc01527370997970c51812dc3a010c7d01b50e0d17dc79c83461010a015234f3fe3d341161014957337f000000000000000000000000000000000000000000000000000000000000000014610030575b005b368060351461008b57600e1461004257005b63a9059cbb60e01b3490815233600452803560901c60245280604481807f00000000000000000000000000000000000000000000000000000000000000005af161002e575b3434fd5b5042343560e01c106100875760043560601c63a9059cbb60e01b34528060045260183560901c6024523434604434347f00000000000000000000000000000000000000000000000000000000000000005af1156100875763022c0d9f60e01b345261010534603435116100fd8161014d565b60045261015f565b6024527f0000000000000000000000000000000000000000000000000000000000000000604452608060645234608452349060a43491349034905af161002e573434fd5b3d3dfd5b15610156573490565b60263560901c90565b1561016d5760263560901c90565b349056";

const USDT_WHALE = "0x5041ed759Dd4aFc3a72b8192C143F72f4724081A";
const USDT_ADDR = "0xdAC17F958D2ee523a2206206994597C13D831ec7";
const USDC_ADDR = "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48";
const UNI_ROUTER = "0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D";

async function deployFixture() {
  const [owner, alice] = await ethers.getSigners();

  await impersonateAccount(USDT_WHALE);
  const whale = await ethers.getSigner(USDT_WHALE);

  const usdt = IERC20__factory.connect(USDT_ADDR, owner);
  const usdc = IERC20__factory.connect(USDC_ADDR, owner);
  const router = IRouter__factory.connect(UNI_ROUTER, owner);
  const pair = IUniswapV2Pair__factory.connect(
    "0x3041CbD36888bECc7bbCBc0045E3B1f144466f5f",
    owner
  );

  await usdt
    .connect(whale)
    .transfer(owner.address, ethers.BigNumber.from(1000).mul(10 ** 6));

  const ContrFactory = new ethers.ContractFactory([], bytecode, owner);
  const swapYulContract = await ContrFactory.deploy();

  return { owner, alice, usdc, usdt, router, pair, swapYulContract, whale };
}

// hh node
// rm -rf test/__* && hh test test/swapper.test.ts --network localhost
describe("", () => {
  let owner: SignerWithAddress;
  let alice: SignerWithAddress;
  let whale: SignerWithAddress;

  let usdc: IERC20;
  let usdt: IERC20;
  let router: IRouter;
  let pair: IUniswapV2Pair;
  let swapYulContract: any;

  beforeEach(async () => {
    ({ alice, owner, usdc, usdt, router, pair, swapYulContract, whale } =
      await loadFixture(deployFixture));
  });

  it("test swap", async () => {
    const amountsOut = await router.getAmountsOut(
      ethers.BigNumber.from(100).mul(10 ** 6),
      [USDT_ADDR, USDC_ADDR]
    );

    await usdt
      .connect(whale)
      .transfer(
        swapYulContract.address,
        ethers.BigNumber.from(100).mul(10 ** 6)
      );

    const deadline = (await time.latest()) + 1200;

    const data = solidityPack(
      ["uint32", "address", "uint112", "uint112", "bool"],
      [
        deadline,
        pair.address,
        amountsOut[0],
        amountsOut[1],
        (await pair.token0()) === USDT_ADDR,
      ]
    );

    await expect(() =>
      owner.sendTransaction({
        to: swapYulContract.address,
        data,
        gasLimit: 120000,
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
    ).to.changeTokenBalance(usdc, alice, amountsOut[1]);
  });

  it("test gas deploy", async () => {
    const ContrFactory = new ethers.ContractFactory([], bytecode, owner);
    await snapshotGasCost(ContrFactory.deploy());
  });

  it("test gas swap", async () => {
    await snapshotGasCost(
      usdt.connect(whale).transfer(swapYulContract.address, 100)
    );

    console.log(await usdt.balanceOf(swapYulContract.address));

    const withdrawData = solidityPack(["uint112"], [99]);

    await expect(() =>
      owner.sendTransaction({
        to: swapYulContract.address,
        data: withdrawData,
      })
    ).to.changeTokenBalance(usdt, owner, 99);

    await snapshotGasCost(
      usdt
        .connect(whale)
        .transfer(
          swapYulContract.address,
          ethers.BigNumber.from(100).mul(10 ** 6)
        )
    );

    const deadline = (await time.latest()) + 1200;

    let amountsOut = await router.getAmountsOut(
      ethers.BigNumber.from(100).mul(10 ** 6),
      [USDT_ADDR, USDC_ADDR]
    );

    let data = solidityPack(
      ["uint32", "address", "uint112", "uint112", "bool"],
      [
        deadline,
        pair.address,
        amountsOut[0],
        amountsOut[1],
        (await pair.token0()) === USDT_ADDR,
      ]
    );

    await snapshotGasCost(
      owner.sendTransaction({
        to: swapYulContract.address,
        data,
        gasLimit: 120000,
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

    await snapshotGasCost(
      usdt
        .connect(whale)
        .transfer(
          swapYulContract.address,
          ethers.BigNumber.from(100).mul(10 ** 6)
        )
    );

    amountsOut = await router.getAmountsOut(
      ethers.BigNumber.from(100).mul(10 ** 6),
      [USDT_ADDR, USDC_ADDR]
    );

    data = solidityPack(
      ["uint32", "address", "uint112", "uint112", "bool"],
      [
        deadline,
        pair.address,
        amountsOut[0],
        amountsOut[1],
        (await pair.token0()) === USDT_ADDR,
      ]
    );

    await snapshotGasCost(
      owner.sendTransaction({
        to: swapYulContract.address,
        data,
        gasLimit: 120000,
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
  });
});
