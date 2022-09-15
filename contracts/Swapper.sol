// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.16;

import { UniswapV2Library } from "./libraries/UniswapV2Library.sol";

import { IUniswapV2Pair } from "./interfaces/IPair.sol";

contract Swapper {
  error NotOwner();
  error Expired();
  error InsufficientOutputAmount();
  error InsufficientInputAmount();
  error TokenTransferFailed();
  error IdenticalAddresses();
  error ZeroAddress();
  error CallError();
  error InsufficientLiquidity();

  address public owner;

  address public recipient; // (?)

  address public factory;
  address public exactToken;

  constructor(
    address _factory,
    address _exactToken,
    address _recipient
  ) {
    recipient = _recipient;
    factory = _factory;
    exactToken = _exactToken;
    owner = msg.sender;
  }

  function withdraw(uint256 amount) external {
    assembly {
      // 0x00 - owner
      if iszero(eq(caller(), sload(0x00))) {
        // 0x30cd7471 == bytes4(keccak256("NotOwner()"))
        mstore(0x00, shl(0xe0, 0x30cd7471))
        revert(0x00, 0x04)
      }
    }

    _safeTransfer(exactToken, msg.sender, amount);
  }

  function balanceOf() external view returns (uint256) {
    // 0x722713f7 == bytes4(keccak256("balanceOf()"))
    (bool success, bytes memory data) = exactToken.staticcall(
      abi.encodeWithSelector(0x722713f7, address(this))
    );

    if (!success) {
      // 0x6c9d47e8 == bytes4(keccak256("CallError()"))
      assembly {
        mstore(0x00, shl(0xe0, 0x6c9d47e8))
        revert(0x00, 0x04)
      }
    }

    return abi.decode(data, (uint256));
  }

  function swapExactTokensForTokens(
    uint256 amountIn,
    address _tokenOut,
    uint256 deadline
  ) external {
    if (deadline < block.timestamp) {
      revert Expired();
    }
    if (amountIn == 0) {
      // 0x098fb561 == bytes4(keccak256("InsufficientInputAmount()"))
      assembly {
        mstore(0x00, shl(0xe0, 0x098fb561))
        revert(0x00, 0x04)
      }
    }

    address _exactToken = exactToken;
    address _factory = factory;
    address pair = UniswapV2Library.pairFor(_factory, _exactToken, _tokenOut);

    uint256 amountOut = UniswapV2Library.getAmountOut(
      amountIn,
      pair,
      _exactToken,
      _tokenOut
    );

    if (amountOut == 0) {
      // 0x42301c23 == bytes4(keccak256("InsufficientOutputAmount()"))
      assembly {
        mstore(0x00, shl(0xe0, 0x42301c23))
        revert(0x00, 0x04)
      }
    }

    _safeTransfer(_exactToken, pair, amountIn);

    (address token0, ) = UniswapV2Library.sortTokens(_exactToken, _tokenOut);

    (uint256 amount0Out, uint256 amount1Out) = _exactToken == token0
      ? (uint256(0), amountOut)
      : (amountOut, uint256(0));

    IUniswapV2Pair(pair).swap(amount0Out, amount1Out, recipient, "");
  }

  function _safeTransfer(
    address token,
    address to,
    uint256 value
  ) internal {
    // bytes4(keccak256(bytes('transfer(address,uint256)')));
    (bool success, bytes memory data) = token.call(
      abi.encodeWithSelector(0xa9059cbb, to, value)
    );

    if (!success && !(data.length == 0 || abi.decode(data, (bool)))) {
      // 0x045c4b02 == bytes4(keccak256("TokenTransferFailed()"))
      assembly {
        mstore(0x00, shl(0xe0, 0x045c4b02))
        revert(0x00, 0x04)
      }
    }
  }
}
