import { expect } from "chai";
import { ethers } from "hardhat";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";

import { defaultAbiCoder } from "ethers/lib/utils";

import { TestStorage__factory } from "../../typechain-types";

// solc --strict-assembly --optimize --optimize-runs 1000 contracts/testYulSol/TestStorage.yul
const bytecode =
  "604c8060113d39336000600201523df3fe337f000000000000000000000000000000000000000000000000000000000000000014602757005b3680604014604157600114603757005b6000543d5260203df35b506020353d35013d5500";

describe("", () => {
  let owner: SignerWithAddress;

  beforeEach(async () => {
    [owner] = await ethers.getSigners();
  });

  it("test", async () => {
    // yul contract => 69292 deploy gas
    const ContrFact = new ethers.ContractFactory([], bytecode, owner);
    const yulContract = await ContrFact.deploy();

    // solidity contract => 108573 deploy gas
    const testSol = await new TestStorage__factory(owner).deploy();

    // 43732
    await testSol.test(42, 42);
    expect(await testSol.res()).to.eq(84);

    const data = defaultAbiCoder.encode(["uint256", "uint256"], [42, 42]);

    // 43445
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
});
