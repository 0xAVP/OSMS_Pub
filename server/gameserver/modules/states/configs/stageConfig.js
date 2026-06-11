const DEFAULT_WAVES = [
    {wave: 1, duration: 10},
    {wave: 2, duration: 10},
    {wave: 3, duration: 10},
    {wave: 4, duration: 10},
    {wave: 5, duration: 10}
];

const default_stage = {
    stage: 'default',
    waves: DEFAULT_WAVES,
    enemies: [
        {type: 1, weight: 1.0},
        {type: 2, weight: 1.0},
        {type: 3, weight: 1.0},
        {type: 4, weight: 1.0},
        {type: 5, weight: 1.0},
        {type: 6, weight: 1.0},
        {type: 7, weight: 1.0},
        {type: 8, weight: 1.0},
        {type: 9, weight: 1.0},
        {type: 10, weight: 1.0},
        {type: 11, weight: 1.0},
        {type: 12, weight: 1.0},
        {type: 13, weight: 1.0},
        {type: 14, weight: 1.0},
        {type: 15, weight: 1.0},
        {type: 16, weight: 1.0},
        {type: 101, weight: 1.0},
        {type: 43, weight: 1.0},
        {type: 44, weight: 1.0},
    ],
    spawnConfig: {
        amount: [12, 18],
        spawnRate: 800
    },
    bossPool: [
        {type: 1001, weight: 1.0},
        {type: 1002, weight: 0.8}
    ],
};
const default_loot_table = {
    resources: {
        pool: [

            {type: 'ferrite_cluster', chance: 0.8, minAmount: 1, maxAmount: 3},
            {type: 'auracite', chance: 0.5, minAmount: 1, maxAmount: 2}
        ]
    }
};

const stageConfig = [

    {
        stage: 1,
        waves: DEFAULT_WAVES,
        enemies: [
            {type: 1, weight: 1.0},
            {type: 2, weight: 0.9},
            {type: 3, weight: 0.5},
            {type: 101, weight: 0.02},

        ],
        bossPool: [{type: 1001, weight: 1.0}],
        spawnConfig: {
            amount: [8, 10],
            spawnRate: 1300
        },
        loot: {
            resources: {
                pool: [
                    {"type": "ferrite_cluster", "chance": 0.80, "minAmount": 4, "maxAmount": 100},
                    {"type": "onyther_rock", "chance": 0.60, "minAmount": 3, "maxAmount": 80},
                    {"type": "osms_coin_part", "chance": 0.20, "minAmount": 1, "maxAmount": 100},

                    {"type": "auracite", "chance": 0.30, "minAmount": 2, "maxAmount": 600},
                    {"type": "voltaic_cell", "chance": 0.30, "minAmount": 2, "maxAmount": 600},
                    {"type": "onyx_blade", "chance": 0.30, "minAmount": 2, "maxAmount": 600},
                    {"type": "crylonite", "chance": 0.20, "minAmount": 1, "maxAmount": 400},
                    {"type": "verdanite_shard", "chance": 0.20, "minAmount": 1, "maxAmount": 400},
                    {"type": "hydronite_gem", "chance": 0.20, "minAmount": 1, "maxAmount": 400}
                ]
            }
        }
    },

    {
        stage: 2,
        waves: DEFAULT_WAVES,
        enemies: [
            {type: 2, weight: 0.8},
            {type: 4, weight: 1.0},
            {type: 5, weight: 0.9},
            {type: 8, weight: 0.5},
            {type: 101, weight: 0.02},
        ],
        bossPool: [{type: 1002, weight: 1.0}],
        spawnConfig: {
            amount: [10, 12],
            spawnRate: 1200
        },
        loot: {
            resources: {
                pool: [

                    {"type": "crylonite", "chance": 0.75, "minAmount": 5, "maxAmount": 12},
                    {"type": "voltaic_cell", "chance": 0.70, "minAmount": 5, "maxAmount": 12},
                    {"type": "osms_coin_part", "chance": 0.20, "minAmount": 2, "maxAmount": 2},

                    {"type": "ferrite_cluster", "chance": 0.40, "minAmount": 3, "maxAmount": 8},
                    {"type": "onyther_rock", "chance": 0.30, "minAmount": 2, "maxAmount": 6},
                    {"type": "auracite", "chance": 0.40, "minAmount": 3, "maxAmount": 8},
                    {"type": "onyx_blade", "chance": 0.30, "minAmount": 2, "maxAmount": 6},
                    {"type": "verdanite_shard", "chance": 0.25, "minAmount": 1, "maxAmount": 5},
                    {"type": "hydronite_gem", "chance": 0.25, "minAmount": 1, "maxAmount": 5}
                ]
            }
        }
    },

    {
        stage: 3,
        waves: DEFAULT_WAVES,
        enemies: [
            {type: 5, weight: 1.0},
            {type: 7, weight: 0.2},
            {type: 8, weight: 0.7},
            {type: 11, weight: 0.8},
            {type: 101, weight: 0.02},
        ],
        bossPool: [{type: 1003, weight: 1.0}],
        spawnConfig: {
            amount: [12, 16],
            spawnRate: 1300
        },
        loot: {
            resources: {
                pool: [

                    {"type": "onyx_blade", "chance": 0.80, "minAmount": 6, "maxAmount": 15},
                    {"type": "auracite", "chance": 0.75, "minAmount": 6, "maxAmount": 15},
                    {"type": "osms_coin_part", "chance": 0.20, "minAmount": 3, "maxAmount": 3},

                    {"type": "ferrite_cluster", "chance": 0.50, "minAmount": 4, "maxAmount": 10},
                    {"type": "voltaic_cell", "chance": 0.50, "minAmount": 4, "maxAmount": 10},
                    {"type": "crylonite", "chance": 0.40, "minAmount": 3, "maxAmount": 8},
                    {"type": "onyther_rock", "chance": 0.40, "minAmount": 3, "maxAmount": 8},
                    {"type": "verdanite_shard", "chance": 0.30, "minAmount": 2, "maxAmount": 6},
                    {"type": "hydronite_gem", "chance": 0.30, "minAmount": 2, "maxAmount": 6}
                ]
            }
        }
    },

    {
        stage: 4,
        waves: DEFAULT_WAVES,
        enemies: [
            {type: 3, weight: 0.7},
            {type: 9, weight: 1.0},
            {type: 11, weight: 0.8},
            {type: 16, weight: 0.6},
            {type: 43, weight: 0.5},
            {type: 101, weight: 0.02},
        ],
        bossPool: [{type: 1004, weight: 1.0}],
        spawnConfig: {
            amount: [12, 18],
            spawnRate: 1300
        },
        loot: {
            resources: {
                pool: [

                    {"type": "verdanite_shard", "chance": 0.80, "minAmount": 7, "maxAmount": 18},
                    {"type": "hydronite_gem", "chance": 0.75, "minAmount": 7, "maxAmount": 18},
                    {"type": "osms_coin_part", "chance": 0.20, "minAmount": 4, "maxAmount": 4},

                    {"type": "ferrite_cluster", "chance": 0.60, "minAmount": 5, "maxAmount": 12},
                    {"type": "voltaic_cell", "chance": 0.60, "minAmount": 5, "maxAmount": 12},
                    {"type": "auracite", "chance": 0.55, "minAmount": 4, "maxAmount": 10},
                    {"type": "onyx_blade", "chance": 0.55, "minAmount": 4, "maxAmount": 10},
                    {"type": "crylonite", "chance": 0.50, "minAmount": 3, "maxAmount": 9},
                    {"type": "onyther_rock", "chance": 0.50, "minAmount": 3, "maxAmount": 9}
                ]
            }
        }
    },

    {
        stage: 5,
        waves: DEFAULT_WAVES,
        enemies: [
            {type: 5, weight: 0.8},
            {type: 7, weight: 0.6},
            {type: 8, weight: 0.7},
            {type: 12, weight: 0.5},
            {type: 43, weight: 0.4},
            {type: 101, weight: 0.02},
        ],
        bossPool: [
            {type: 1005, weight: 1.0}
        ],
        spawnConfig: {
            amount: [13, 18],
            spawnRate: 950
        }
    },

    {
        stage: 6,
        waves: DEFAULT_WAVES,
        enemies: [
            {type: 3, weight: 0.6},
            {type: 6, weight: 0.8},
            {type: 11, weight: 0.9},
            {type: 12, weight: 0.6},
            {type: 13, weight: 0.4},
            {type: 101, weight: 0.02},
        ],
        bossPool: [
            {type: 1006, weight: 1.0}
        ],
        spawnConfig: {
            amount: [14, 20],
            spawnRate: 900
        }
    },

    {
        stage: 7,
        waves: DEFAULT_WAVES,
        enemies: [
            {type: 6, weight: 0.7},
            {type: 12, weight: 0.7},
            {type: 14, weight: 0.4},
            {type: 16, weight: 0.8},
            {type: 44, weight: 0.5},
            {type: 101, weight: 0.02},
        ],
        bossPool: [
            {type: 1007, weight: 0.8}
        ],
        spawnConfig: {
            amount: [14, 20],
            spawnRate: 850
        }
    },

    {
        stage: 8,
        waves: DEFAULT_WAVES,
        enemies: [
            {type: 8, weight: 0.8},
            {type: 12, weight: 0.6},
            {type: 13, weight: 0.5},
            {type: 15, weight: 0.4},
            {type: 44, weight: 0.6},
            {type: 101, weight: 0.02},
        ],
        bossPool: [
            {type: 1001, weight: 1.0},
            {type: 1002, weight: 1.0}
        ],
        spawnConfig: {
            amount: [15, 22],
            spawnRate: 800
        }
    },

    {
        stage: 9,
        waves: DEFAULT_WAVES,
        enemies: [
            {type: 7, weight: 0.7},
            {type: 12, weight: 0.8},
            {type: 13, weight: 0.6},
            {type: 15, weight: 0.5},
            {type: 44, weight: 0.7},
            {type: 101, weight: 0.02},
        ],
        bossPool: [
            {type: 1001, weight: 1.0},
            {type: 1002, weight: 1.0}
        ],
        spawnConfig: {
            amount: [16, 24],
            spawnRate: 750
        }
    },

    {
        stage: 10,
        waves: DEFAULT_WAVES,
        enemies: [
            {type: 8, weight: 0.8},
            {type: 12, weight: 1.0},
            {type: 13, weight: 0.7},
            {type: 15, weight: 0.6},
            {type: 44, weight: 0.8},
            {type: 101, weight: 0.02},
        ],
        bossPool: [
            {type: 1001, weight: 1.0},
            {type: 1002, weight: 1.0}
        ],
        spawnConfig: {
            amount: [18, 26],
            spawnRate: 700
        }
    },

    {
        stage: 11,
        waves: DEFAULT_WAVES,
        enemies: [
            {type: 9, weight: 1.0},
            {type: 11, weight: 0.8},
            {type: 13, weight: 0.9},
            {type: 16, weight: 0.8},
            {type: 6, weight: 0.7},
            {type: 8, weight: 0.6},
            {type: 101, weight: 0.02},
        ],
        bossPool: [{type: 1001, weight: 1.0}, {type: 1002, weight: 1.0}],
        spawnConfig: {amount: [18, 28], spawnRate: 680}
    },

    {
        stage: 12,
        waves: DEFAULT_WAVES,
        enemies: [
            {type: 43, weight: 0.9},
            {type: 44, weight: 1.0},
            {type: 7, weight: 0.8},
            {type: 12, weight: 0.7},
            {type: 5, weight: 0.6},
            {type: 16, weight: 0.5},
            {type: 101, weight: 0.02},
        ],
        bossPool: [{type: 1001, weight: 1.0}, {type: 1002, weight: 1.0}],
        spawnConfig: {amount: [19, 28], spawnRate: 660}
    },

    {
        stage: 13,
        waves: DEFAULT_WAVES,
        enemies: [
            {type: 14, weight: 0.8},
            {type: 15, weight: 1.0},
            {type: 12, weight: 0.9},
            {type: 3, weight: 0.7},
            {type: 8, weight: 0.6},
            {type: 11, weight: 0.5},
            {type: 101, weight: 0.02},
        ],
        bossPool: [{type: 1001, weight: 1.0}, {type: 1002, weight: 1.0}],
        spawnConfig: {amount: [20, 30], spawnRate: 640}
    },

    {
        stage: 14,
        waves: DEFAULT_WAVES,
        enemies: [
            {type: 13, weight: 1.0},
            {type: 15, weight: 1.0},
            {type: 44, weight: 0.7},
            {type: 7, weight: 0.8},
            {type: 12, weight: 0.6},
            {type: 4, weight: 0.5},
            {type: 101, weight: 0.02},
        ],
        bossPool: [{type: 1001, weight: 1.0}, {type: 1002, weight: 1.0}],
        spawnConfig: {amount: [20, 32], spawnRate: 620}
    },

    {
        stage: 15,
        waves: DEFAULT_WAVES,
        enemies: [
            {type: 12, weight: 1.0},
            {type: 44, weight: 0.9},
            {type: 14, weight: 0.8},
            {type: 9, weight: 0.7},
            {type: 3, weight: 0.6},
            {type: 6, weight: 0.5},
            {type: 101, weight: 0.02},
        ],
        bossPool: [{type: 1001, weight: 1.0}, {type: 1002, weight: 1.0}],
        spawnConfig: {amount: [22, 32], spawnRate: 600}
    },

    {
        stage: 16,
        waves: DEFAULT_WAVES,
        enemies: [
            {type: 12, weight: 1.0},
            {type: 13, weight: 0.9},
            {type: 15, weight: 0.8},
            {type: 44, weight: 0.9},
            {type: 8, weight: 0.7},
            {type: 7, weight: 0.6},
            {type: 101, weight: 0.02},
        ],
        bossPool: [{type: 1001, weight: 1.0}, {type: 1002, weight: 1.0}],
        spawnConfig: {amount: [22, 34], spawnRate: 580}
    },

    {
        stage: 17,
        waves: DEFAULT_WAVES,
        enemies: [
            {type: 8, weight: 1.0},
            {type: 12, weight: 0.8},
            {type: 15, weight: 0.9},
            {type: 7, weight: 0.9},
            {type: 11, weight: 0.7},
            {type: 16, weight: 0.6},
            {type: 101, weight: 0.02},
        ],
        bossPool: [{type: 1001, weight: 1.0}, {type: 1002, weight: 1.0}],
        spawnConfig: {amount: [24, 34], spawnRate: 560}
    },

    {
        stage: 18,
        waves: DEFAULT_WAVES,
        enemies: [
            {type: 13, weight: 1.0},
            {type: 44, weight: 1.0},
            {type: 43, weight: 0.8},
            {type: 15, weight: 0.7},
            {type: 7, weight: 0.8},
            {type: 12, weight: 0.6},
            {type: 101, weight: 0.02},
        ],
        bossPool: [{type: 1001, weight: 1.0}, {type: 1002, weight: 1.0}],
        spawnConfig: {amount: [24, 36], spawnRate: 540}
    },

    {
        stage: 19,
        waves: DEFAULT_WAVES,
        enemies: [
            {type: 12, weight: 1.0},
            {type: 13, weight: 0.9},
            {type: 14, weight: 0.7},
            {type: 15, weight: 0.8},
            {type: 44, weight: 0.9},
            {type: 8, weight: 0.8},
            {type: 101, weight: 0.02},
        ],
        bossPool: [{type: 1001, weight: 1.0}, {type: 1002, weight: 1.0}],
        spawnConfig: {amount: [25, 38], spawnRate: 520}
    },

    {
        stage: 20,
        waves: DEFAULT_WAVES,
        enemies: [
            {type: 12, weight: 1.0},
            {type: 13, weight: 1.0},
            {type: 15, weight: 1.0},
            {type: 44, weight: 1.0},
            {type: 8, weight: 0.9},
            {type: 7, weight: 0.9},
            {type: 11, weight: 0.8},
            {type: 101, weight: 0.02},
        ],
        bossPool: [{type: 1001, weight: 1.0}, {type: 1002, weight: 1.0}],
        spawnConfig: {amount: [26, 40], spawnRate: 500}
    }

];

module.exports = {stageConfig, default_stage, default_loot_table};