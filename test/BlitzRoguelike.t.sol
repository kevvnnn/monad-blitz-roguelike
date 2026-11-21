// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Test.sol";
import "../contracts/BlitzRoguelike.sol";

contract BlitzRoguelikeTest is Test {
    BlitzRoguelike public blitz;
    address public player1 = address(0x1111);
    address public player2 = address(0x2222);

    function setUp() public {
        blitz = new BlitzRoguelike{value: 10 ether}();
        vm.deal(player1, 5 ether);
        vm.deal(player2, 5 ether);
    }

    function testStartRun() public {
        vm.startPrank(player1);
        uint256 runId = blitz.startRun{value: 0.1 ether}(1042);
        assertEq(runId, 1);
        assertEq(blitz.prizePool(), 10.1 ether);

        (uint256 seed, uint8 floor, uint256 score, bool active, bool extracted) = blitz.activeRuns(player1);
        assertEq(seed, 1042);
        assertEq(floor, 1);
        assertEq(score, 0);
        assertTrue(active);
        assertFalse(extracted);
        vm.stopPrank();
    }

    function testFailDoubleStartRun() public {
        vm.startPrank(player1);
        blitz.startRun{value: 0.1 ether}(1042);
        blitz.startRun{value: 0.1 ether}(1043); // should fail
        vm.stopPrank();
    }

    function testPersistGravestoneAndRetrieve() public {
        vm.startPrank(player1);
        blitz.startRun{value: 0.1 ether}(1042);

        blitz.persistGravestone(1, 1042, 1, 5, 8, 450, block.timestamp);

        BlitzRoguelike.Gravestone[] memory graves = blitz.getGravestones(1042, 1);
        assertEq(graves.length, 1);
        assertEq(graves[0].player, player1);
        assertEq(graves[0].posX, 5);
        assertEq(graves[0].posY, 8);
        assertEq(graves[0].finalScore, 450);
        vm.stopPrank();
    }

    function testSubmitResultAndPayout() public {
        vm.startPrank(player1);
        blitz.startRun{value: 0.1 ether}(1042);

        uint256 balanceBefore = player1.balance;
        // score 500 => 500 / 250 = 2 MON
        blitz.submitResult(1, 1042, 2, 500, false);

        uint256 balanceAfter = player1.balance;
        assertEq(balanceAfter - balanceBefore, 2 ether);
        assertEq(blitz.bestScore(player1), 500);
        assertEq(blitz.totalPayout(player1), 2 ether);
        vm.stopPrank();
    }
}
