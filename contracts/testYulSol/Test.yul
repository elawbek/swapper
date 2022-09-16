object "UniswapOptimized" {
    code {
        codecopy(0x00, dataoffset("runtime"), datasize("runtime"))
        setimmutable(0x00, "owner", caller())
        return(0x00, datasize("runtime"))
    }
    object "runtime" {
        code {
            if eq(loadimmutable("owner"), caller()) {
                    mstore(0x00, add(calldataload(0x00), calldataload(0x20)))
                    return(0, 0x20)
            }
            revert(0x00, 0x00)
        }
    }
}