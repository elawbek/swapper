// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.0;

import { IUniswapV2Pair } from "../interfaces/IPair.sol";

library UniswapV2Library {
  // returns sorted token addresses, used to handle return values from pairs sorted in this order
  function sortTokens(address tokenA, address tokenB)
    internal
    pure
    returns (address token0, address token1)
  {
    if (tokenA == tokenB) {
      // 0xbd969eb0 == bytes4(keccak256("IdenticalAddresses()"))
      assembly {
        mstore(0x00, shl(0xe0, 0xbd969eb0))
        revert(0x00, 0x04)
      }
    }

    (token0, token1) = tokenA < tokenB ? (tokenA, tokenB) : (tokenB, tokenA);

    if (token0 == address(0)) {
      // 0xd92e233d == bytes4(keccak256("ZeroAddress()"))
      assembly {
        mstore(0x00, shl(0xe0, 0xd92e233d))
        revert(0x00, 0x04)
      }
    }
  }

  // calculates the CREATE2 address for a pair without making any external calls
  function pairFor(
    address factory,
    address tokenA,
    address tokenB
  ) internal pure returns (address pair) {
    (address token0, address token1) = sortTokens(tokenA, tokenB);
    pair = address(
      uint160(
        uint256(
          keccak256(
            abi.encodePacked(
              hex"ff",
              factory,
              keccak256(abi.encodePacked(token0, token1)),
              hex"96e8ac4277198ff8b6f785478aa9a39f403cb768dd02cbee326c3e7da348845f" // init code hash
            )
          )
        )
      )
    );
  }

  // fetches and sorts the reserves for a pair
  function getReserves(
    address pair,
    address tokenA,
    address tokenB
  ) internal view returns (uint256 reserveA, uint256 reserveB) {
    (address token0, ) = sortTokens(tokenA, tokenB);

    (uint256 reserve0, uint256 reserve1, ) = IUniswapV2Pair(pair).getReserves();

    (reserveA, reserveB) = tokenA == token0
      ? (reserve0, reserve1)
      : (reserve1, reserve0);
  }

  // performs chained getAmountOut calculations on any number of pairs
  function getAmountOut(
    uint256 amountIn,
    address pair,
    address exactToken,
    address tokenOut
  ) internal view returns (uint256 amountOut) {
    (uint256 reserveIn, uint256 reserveOut) = getReserves(
      pair,
      exactToken,
      tokenOut
    );

    if (reserveIn == 0 && reserveOut == 0) {
      // 0xbb55fd27 == bytes4(keccak256("InsufficientLiquidity()"))
      assembly {
        mstore(0x00, shl(0xe0, 0xbb55fd27))
        revert(0x00, 0x04)
      }
    }

    unchecked {
      uint256 amountInWithFee = amountIn * 997;
      uint256 numerator = amountInWithFee * reserveOut;
      uint256 denominator = reserveIn * 1000 + amountInWithFee;
      amountOut = numerator / denominator;
    }
  }
}
