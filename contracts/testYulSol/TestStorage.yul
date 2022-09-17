object "TestStorage" {
  code {
    codecopy(returndatasize(), dataoffset("runtime"), datasize("runtime"))
    setimmutable(returndatasize(), "owner", caller())
    return(returndatasize(), datasize("runtime"))
  }

  object "runtime" {
    code {
      if eq(loadimmutable("owner"), caller()) {
        switch calldatasize()

        case 0x02 {
          sstore(
            returndatasize(),
            add(shr(0xf8, calldataload(0x00)), shr(0xf8, calldataload(0x01)))
          )
        }

        case 0x01 {
            mstore(returndatasize(), sload(0x00))
            return(returndatasize(), 0x20)
        }
      }
    }
  }
}