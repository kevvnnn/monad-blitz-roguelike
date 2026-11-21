// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title BlitzRoguelike
 * @dev On-chain trust layer for Monad Blitz Roguelike.
 *      Manages entry fee escrow, deterministic run validation,
 *      permanent on-chain gravestones, fallen player ghosts, and prize payouts.
 */
contract BlitzRoguelike {
    uint256 public constant ENTRY_FEE = 0.1 ether; // 0.1 MON entry fee
    uint256 public constant MAX_PAYOUT_PER_RUN = 5.0 ether; // 5.0 MON payout cap per run

    uint256 public prizePool;
    uint256 public runCounter;

    struct Run {
        uint256 seed;
        uint8 floor;
        uint256 score;
        bool active;
        bool extracted;
    }

    struct Gravestone {
        uint256 runId;
        address player;
        uint256 seed;
        uint8 floor;
        uint256 posX;
        uint256 posY;
        uint256 finalScore;
        uint256 diedAt;
        bool lootClaimed;
        bool ghostDefeated;
    }

    mapping(address => Run) public activeRuns;
    mapping(uint256 => mapping(uint256 => Gravestone[])) public gravestones;
    mapping(address => uint256) public bestScore;
    mapping(address => uint256) public totalPayout;

    // Events
    event RunStarted(address indexed player, uint256 runId, uint256 seed);
    event RunResultSubmitted(address indexed player, uint256 runId, uint256 score, bool died);
    event GravestonePersisted(uint256 indexed runId, address indexed player, uint256 seed, uint8 floor);
    event PayoutSettled(address indexed player, uint256 amount, uint256 score);
    event PrizePoolFunded(address indexed donor, uint256 amount);

    modifier onlyActiveRun(address player) {
        require(activeRuns[player].active, "No active run for this address");
        _;
    }

    constructor() payable {
        if (msg.value > 0) {
            prizePool += msg.value;
        }
    }

    /**
     * @notice Starts a new dungeon run by escrowing the 0.1 MON entry fee.
     * @param seed Deterministic seed for dungeon layout.
     */
    function startRun(uint256 seed) external payable returns (uint256) {
        require(msg.value == ENTRY_FEE, "Entry fee must be exactly 0.1 MON");
        require(!activeRuns[msg.sender].active, "Address already has an active run");

        prizePool += msg.value;
        runCounter++;

        activeRuns[msg.sender] = Run({
            seed: seed,
            floor: 1,
            score: 0,
            active: true,
            extracted: false
        });

        emit RunStarted(msg.sender, runCounter, seed);
        return runCounter;
    }

    /**
     * @notice Submits a completed run result, settling prize payouts.
     */
    function submitResult(
        uint256 runId,
        uint256 seed,
        uint8 floor,
        uint256 score,
        bool died
    ) external onlyActiveRun(msg.sender) {
        Run storage run = activeRuns[msg.sender];
        require(!run.extracted, "Run has already been extracted");
        require(run.seed == seed, "Dungeon seed mismatch");

        run.extracted = true;
        run.active = false;
        run.floor = floor;
        run.score = score;

        uint256 payout = calculatePayout(score);
        if (payout > 0) {
            require(prizePool >= payout, "Insufficient funds in prize pool");
            prizePool -= payout;

            (bool sent, ) = payable(msg.sender).call{value: payout}("");
            require(sent, "Payout transfer failed");
        }

        if (score > bestScore[msg.sender]) {
            bestScore[msg.sender] = score;
        }
        totalPayout[msg.sender] += payout;

        emit RunResultSubmitted(msg.sender, runId, score, died);
        emit PayoutSettled(msg.sender, payout, score);
    }

    /**
     * @notice Permanently records a player's gravestone upon dungeon death.
     */
    function persistGravestone(
        uint256 runId,
        uint256 seed,
        uint8 floor,
        uint256 posX,
        uint256 posY,
        uint256 finalScore,
        uint256 diedAt
    ) external onlyActiveRun(msg.sender) {
        gravestones[seed][floor].push(
            Gravestone({
                runId: runId,
                player: msg.sender,
                seed: seed,
                floor: floor,
                posX: posX,
                posY: posY,
                finalScore: finalScore,
                diedAt: diedAt,
                lootClaimed: false,
                ghostDefeated: false
            })
        );

        emit GravestonePersisted(runId, msg.sender, seed, floor);
    }

    /**
     * @notice Returns all gravestones for a specific dungeon seed and floor.
     */
    function getGravestones(uint256 seed, uint8 floor) external view returns (Gravestone[] memory) {
        return gravestones[seed][floor];
    }

    /**
     * @notice Calculates MON payout based on score and prize pool balance.
     */
    function calculatePayout(uint256 score) public view returns (uint256) {
        if (score == 0 || prizePool == 0) return 0;
        uint256 raw = (score * 1e18) / 250; // Score / 250 MON
        uint256 capped = raw > MAX_PAYOUT_PER_RUN ? MAX_PAYOUT_PER_RUN : raw;
        return capped > prizePool ? prizePool : capped;
    }

    /**
     * @notice Allows hackathon sponsors or players to fund the shared prize pool.
     */
    function fundPrizePool() external payable {
        require(msg.value > 0, "Must provide MON to fund prize pool");
        prizePool += msg.value;
        emit PrizePoolFunded(msg.sender, msg.value);
    }

    receive() external payable {
        prizePool += msg.value;
        emit PrizePoolFunded(msg.sender, msg.value);
    }

    fallback() external payable {
        prizePool += msg.value;
        emit PrizePoolFunded(msg.sender, msg.value);
    }
}
