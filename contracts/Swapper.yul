object "TestStorage" {
  code {
    codecopy(
      callvalue(), // 0x00
      dataoffset("runtime"),
      datasize("runtime")
    )

    setimmutable(
      callvalue(), // 0x00
      "owner", // name
      caller() // msg.sender
    )

    setimmutable(
      callvalue(), // 0x00
      "expectToken", // name
      0xdAC17F958D2ee523a2206206994597C13D831ec7 // expectToken
    )

    setimmutable(
      callvalue(), // 0x00
      "recipient", // name
      0x70997970C51812dc3A010C7d01b50e0d17dc79C8 // recipient
    )

    return(
      callvalue(), // 0x00
      datasize("runtime")
    )
  }

  object "runtime" {
    code {
      if eq(loadimmutable("owner"), caller()) {
        switch calldatasize()

        case 0x39 { // swap
          // timestamp check
          if lt(shr(0xe0, calldataload(callvalue())), timestamp()) {
            revert(
              callvalue(), // 0x00
              callvalue() // 0x00
            )
          }

          let pairAddr := shr(0x60, calldataload(0x04))

          // =============================================
          // transfer token to pair
          mstore(
            callvalue(), // 0x00
            shl(0xe0, 0xa9059cbb) // transfer(address,uint256)
          )

          mstore(
            0x04, // func signature 0x04 bytes
            pairAddr
          )

          mstore(
            0x24,
            shr(0x80, calldataload(0x18)) // amountIn
          )

          if iszero(
              call(
                gas(), // gas
                loadimmutable("expectToken"),
                callvalue(), // wei 0x00
                callvalue(), // in pos 0x00
                0x44, // len
                callvalue(), // out pos 0x00
                callvalue() // out size 0x00
              )
            ) {
            revert(
              callvalue(), // 0x00
              callvalue() // 0x00
            )
          }
          // =============================================

          // =============================================
          // swap
          mstore(
            callvalue(), // 0x00
            shl(0xe0, 0x022c0d9f) // swap(uint256,uint256,address,bytes)
          )

          let tokenOut := shr(0xf8, calldataload(0x38))

          mstore(
            0x04, // func signature 0x04 bytes
            token0Out(tokenOut)
          )

          mstore(
            0x24,
            token1Out(tokenOut)
          )

          mstore(
            0x44,
            loadimmutable("recipient")
          )

          mstore(
            0x64, // 4+32+32+32
            128 // position of where length of "bytes data" is stored from first arg (excluding func signature)
          )

          mstore(
            0x84,
            callvalue() // length of "bytes data" 0x00
          )

          if iszero(
              call(
                gas(), // gas
                pairAddr,
                callvalue(), // wei
                callvalue(), // in pos
                0xa4, // len
                callvalue(), // out pos
                callvalue() // out size
              )
            ) {
            revert(
              callvalue(), // 0x00
              callvalue() // 0x00
            )
          }
          // =============================================
        }

        function token0Out(a) -> r {
          switch a
          case 0x00 {
            r := shr(0x80, calldataload(0x28))
          }
          default {
            r := callvalue()
          }
        }

        function token1Out(a) -> r {
          switch a
          case 0x00 {
            r := callvalue()
          }
          default {
            r := shr(0x80, calldataload(0x28))
          }
        }
      }
    }
  }
}