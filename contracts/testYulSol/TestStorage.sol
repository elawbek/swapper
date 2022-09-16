// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

contract TestStorage {
  address private immutable _owner;
  uint256 public res;

  constructor() {
    _owner = msg.sender;
  }

  function test(uint256 a, uint256 b) external {
    if (msg.sender == _owner) {
      unchecked {
        res = a + b;
      }
    }
  }
}
