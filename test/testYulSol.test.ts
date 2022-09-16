import { expect } from "chai";
import { ethers } from "hardhat";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";

import { defaultAbiCoder } from "ethers/lib/utils";

import { Test__factory } from "../typechain-types";

// solc --strict-assembly --optimize --optimize-runs 1000 contracts/testYulSol/Test.yul
const bytecode =
  "603a806013600039336000600201526000f3fe337f000000000000000000000000000000000000000000000000000000000000000014602a57600080fd5b6020356000350160005260206000f3";

describe("", () => {
  let owner: SignerWithAddress;
  let alice: SignerWithAddress;

  beforeEach(async () => {
    [owner, alice] = await ethers.getSigners();
  });

  it("test", async () => {
    // yul contract => 65408 deploy gas
    const ContrFact = new ethers.ContractFactory([], bytecode, owner);
    const yulContract = await ContrFact.deploy();

    // solidity contract => 117993 deploy gas
    await new Test__factory(owner).deploy();

    const data = defaultAbiCoder.encode(["uint256", "uint256"], [42, 42]);
    console.log(
      await ethers.provider.send("eth_call", [
        {
          to: yulContract.address,
          data,
          from: owner.address,
        },
        "latest",
      ])
    );

    // Not owner revert
    await expect(
      ethers.provider.send("eth_call", [
        {
          to: yulContract.address,
          data,
          from: alice.address,
        },
        "latest",
      ])
    ).to.revertedWithoutReason();
  });
});
