// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Script.sol";
import "../contracts/BlitzRoguelike.sol";

contract DeployScript is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envOr("PRIVATE_KEY", uint256(0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80));
        
        vm.startBroadcast(deployerPrivateKey);

        // Deploy contract with optional initial prize pool seeding
        BlitzRoguelike blitz = new BlitzRoguelike{value: 0.1 ether}();

        console.log("BlitzRoguelike successfully deployed to:", address(blitz));
        console.log("Initial prize pool (MON wei):", blitz.prizePool());
        console.log("Entry fee:", blitz.ENTRY_FEE());

        vm.stopBroadcast();
    }
}
