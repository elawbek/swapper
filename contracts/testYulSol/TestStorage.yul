object "TestStorage" {
  code {
    codecopy(returndatasize(), dataoffset("runtime"), datasize("runtime"))
    setimmutable(0x00, "owner", caller())
    return(returndatasize(), datasize("runtime"))
  }

  object "runtime" {
    code {
      if eq(loadimmutable("owner"), caller()) {
        switch calldatasize()

        case 0x40 {
          sstore(returndatasize(), add(calldataload(returndatasize()), calldataload(0x20)))
        }

        case 0x01 {
          mstore(returndatasize(), sload(0x00))
          return(returndatasize(), 0x20)
        }
      }
    }
  }
}