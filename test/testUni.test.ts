import { expect } from "chai";
import { ethers } from "hardhat";

import {
  loadFixture,
  impersonateAccount,
  time,
} from "@nomicfoundation/hardhat-network-helpers";

import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { constants } from "ethers";
import { parseEther } from "ethers/lib/utils";

import snapshotGasCost from "./snapshots";
import { UNI_ROUTER, WETH, WETH_WAHLE, tokens } from "./helper";

import {
  IRouter,
  IRouter__factory,
  IERC20,
  IERC20__factory,
  IERC20Metadata__factory,
} from "../typechain-types";

async function deployFixture() {
  const [owner, alice] = await ethers.getSigners();

  await impersonateAccount(WETH_WAHLE);
  const whale = await ethers.getSigner(WETH_WAHLE);

  const weth = IERC20__factory.connect(WETH, owner);
  const token = IERC20__factory.connect(tokens[0], owner);
  const router = IRouter__factory.connect(UNI_ROUTER, owner);

  return { owner, alice, weth, token, router, whale };
}

// hh node
// rm -rf test/__* && hh test test/testUni.test.ts --network localhost
describe("", () => {
  let owner: SignerWithAddress;
  let alice: SignerWithAddress;
  let whale: SignerWithAddress;

  let weth: IERC20;
  let token: IERC20;
  let router: IRouter;

  beforeEach(async () => {
    ({ owner, alice, token, weth, router, whale } = await loadFixture(
      deployFixture
    ));
  });

  xit("swap usdt -> usdc", async () => {
    await weth.connect(whale).transfer(owner.address, parseEther("0.1"));

    const amountsOut = await router.getAmountsOut(parseEther("0.1"), [
      WETH,
      token.address,
    ]);

    await weth.connect(owner).approve(UNI_ROUTER, parseEther("0.1"));

    await expect(async () =>
      router
        .connect(owner)
        .swapExactTokensForTokens(
          parseEther("0.1"),
          0,
          [weth.address, token.address],
          alice.address,
          (await time.latest()) + 1200
        )
    ).to.changeTokenBalance(token, alice, amountsOut[1]);
  });

  it("swap gas", async () => {
    await snapshotGasCost(
      weth.connect(owner).approve(UNI_ROUTER, constants.MaxUint256)
    );
    await weth.connect(whale).transfer(owner.address, 1);

    for (let i = 0; i < tokens.length; i++) {
      const token = IERC20Metadata__factory.connect(tokens[i], owner);
      const wethMeta = IERC20Metadata__factory.connect(WETH, owner);

      console.log(`Pair: ${await wethMeta.name()} - ${await token.name()}`);
      console.log(
        `Pair: ${await wethMeta.symbol()} - ${await token.symbol()}\n`
      );

      await snapshotGasCost(
        weth.connect(whale).transfer(owner.address, parseEther("0.1"))
      );

      await snapshotGasCost(
        router
          .connect(owner)
          .swapExactTokensForTokens(
            parseEther("0.1"),
            0,
            [WETH, tokens[i]],
            alice.address,
            (await time.latest()) + 1200
          )
      );

      await snapshotGasCost(
        weth.connect(whale).transfer(owner.address, parseEther("0.1"))
      );

      await snapshotGasCost(
        router
          .connect(owner)
          .swapExactTokensForTokens(
            parseEther("0.1"),
            0,
            [WETH, tokens[i]],
            alice.address,
            (await time.latest()) + 1200
          )
      );
    }
  }).timeout(2000000);
});
