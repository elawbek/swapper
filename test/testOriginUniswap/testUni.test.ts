import { expect } from "chai";
import { ethers } from "hardhat";

import {
  loadFixture,
  impersonateAccount,
  time,
} from "@nomicfoundation/hardhat-network-helpers";

import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";

import snapshotGasCost from "../snapshots";

import {
  IRouter,
  IRouter__factory,
  IERC20,
  IERC20__factory,
} from "../../typechain-types";

const USDT_WHALE = "0x5041ed759Dd4aFc3a72b8192C143F72f4724081A";
const UNI_ROUTER = "0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D";
const USDT_ADDR = "0xdAC17F958D2ee523a2206206994597C13D831ec7";
const USDC_ADDR = "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48";

async function deployFixture() {
  const [owner, alice] = await ethers.getSigners();

  await impersonateAccount(USDT_WHALE);
  const whale = await ethers.getSigner(USDT_WHALE);

  const usdt = IERC20__factory.connect(USDT_ADDR, owner);
  const usdc = IERC20__factory.connect(USDC_ADDR, owner);
  const router = IRouter__factory.connect(UNI_ROUTER, owner);

  await usdt
    .connect(whale)
    .transfer(owner.address, ethers.BigNumber.from(300).mul(10 ** 6));

  return { owner, alice, usdc, usdt, router };
}

// hh node
// rm -rf test/testOriginUniswap/__* && hh test test/testOriginUniswap/testUni.test.ts --network localhost
describe("", () => {
  let owner: SignerWithAddress;
  let alice: SignerWithAddress;

  let usdc: IERC20;
  let usdt: IERC20;
  let router: IRouter;

  beforeEach(async () => {
    ({ owner, alice, usdc, usdt, router } = await loadFixture(deployFixture));
  });

  it("swap gas 1", async () => {
    await snapshotGasCost(
      usdt
        .connect(owner)
        .approve(UNI_ROUTER, ethers.BigNumber.from(100).mul(10 ** 6))
    );

    await snapshotGasCost(
      router
        .connect(owner)
        .swapExactTokensForTokens(
          ethers.BigNumber.from(100).mul(10 ** 6),
          0,
          [USDT_ADDR, USDC_ADDR],
          alice.address,
          (await time.latest()) + 1200
        )
    );
  });

  it("swap usdt -> usdc", async () => {
    const amountsOut = await router.getAmountsOut(
      ethers.BigNumber.from(100).mul(10 ** 6),
      [USDT_ADDR, USDC_ADDR]
    );

    await usdt
      .connect(owner)
      .approve(UNI_ROUTER, ethers.BigNumber.from(100).mul(10 ** 6));

    await expect(async () =>
      router
        .connect(owner)
        .swapExactTokensForTokens(
          ethers.BigNumber.from(100).mul(10 ** 6),
          0,
          [USDT_ADDR, USDC_ADDR],
          alice.address,
          (await time.latest()) + 1200
        )
    ).to.changeTokenBalance(usdc, alice, amountsOut[1]);
  });

  it("swap gas 2", async () => {
    await snapshotGasCost(
      usdt
        .connect(owner)
        .approve(UNI_ROUTER, ethers.BigNumber.from(100).mul(10 ** 6))
    );

    await snapshotGasCost(
      router
        .connect(owner)
        .swapExactTokensForTokens(
          ethers.BigNumber.from(100).mul(10 ** 6),
          0,
          [USDT_ADDR, USDC_ADDR],
          alice.address,
          (await time.latest()) + 1200
        )
    );
  });
});
