import { expect } from "chai";
import { ethers } from "hardhat";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";

import snapshotGasCost from "../snapshots";

import { solidityPack } from "ethers/lib/utils";

import { TestStorage__factory } from "../../typechain-types";

// solc --strict-assembly --optimize --optimize-runs 1000 contracts/testYulSol/TestStorage.yul
const bytecode =
  "60538060103d39333d600201523df3fe337f000000000000000000000000000000000000000000000000000000000000000014602757005b3680600214604157600114603757005b6000543d5260203df35b5060013560f81c60003560f81c013d5500";

// hh node
// rm -rf test/testsYulSol/__* && hh test test/testsYulSol/testYulSolStorage.test.ts --network localhost
describe("", () => {
  let owner: SignerWithAddress;

  beforeEach(async () => {
    [owner] = await ethers.getSigners();
  });

  it("test", async () => {
    // Solidity contract:
    const testSol = await new TestStorage__factory(owner).deploy();

    await testSol.test(42, 42);
    expect(await testSol.res()).to.eq(84);

    // Yul contract:
    const ContrFact = new ethers.ContractFactory([], bytecode, owner);
    const yulContract = await ContrFact.deploy();

    const data = solidityPack(["uint8", "uint8"], [42, 42]);

    await owner.sendTransaction({
      to: yulContract.address,
      data,
    });

    expect(
      +(await ethers.provider.send("eth_call", [
        {
          to: yulContract.address,
          data: "0xff",
          from: owner.address,
        },
        "latest",
      ]))
    ).to.eq(84);
  });

  describe("gas checker", () => {
    it("deploy yul contract gas", async () => {
      const ContrFact = new ethers.ContractFactory([], bytecode, owner);

      await snapshotGasCost(ContrFact.deploy());
    });

    it("deploy solidity contract gas", async () => {
      await snapshotGasCost(new TestStorage__factory(owner).deploy());
    });

    it("change storage gas yul contract", async () => {
      const ContrFact = new ethers.ContractFactory([], bytecode, owner);
      const yulContract = await ContrFact.deploy();

      const data = solidityPack(["uint8", "uint8"], [42, 42]);

      await snapshotGasCost(
        owner.sendTransaction({
          to: yulContract.address,
          data,
        })
      );
    });

    it("change storage gas solidity contract", async () => {
      const testSol = await new TestStorage__factory(owner).deploy();

      await snapshotGasCost(testSol.test(42, 42));
    });
  });
});
