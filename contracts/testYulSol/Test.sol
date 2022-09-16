// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

contract Test {
  address private immutable _owner;

  constructor() {
    _owner = msg.sender;
  }

  function add(uint256 a, uint256 b) external view returns (uint256) {
    if (msg.sender == _owner) {
      return a + b;
    }

    revert();
  }
}
