const {compilePattern} = require('./patternCompiler');

const WEAPONS = {
    spreadWeapon: {
        bulletType: 1,
        bulletDamage: 2,
        bulletSpeed: 300,
        fireRate: 1000,
        bulletSize: {width: 15, height: 15},
        firePattern: compilePattern({
            targeting: 'forward',
            shape: 'spread',
            params: {
                bulletCount: 5,
                spreadAngle: 40
            }
        })
    },
    singleWeapon: {
        bulletType: 4,
        bulletDamage: 2,
        bulletSpeed: 400,
        fireRate: 1500,
        bulletSize: {width: 15, height: 15},
        firePattern: compilePattern({
            targeting: 'forward',
            shape: 'single'
        })
    },
    singleTargetedWeapon: {
        bulletType: 4,
        bulletDamage: 2,
        bulletSpeed: 400,
        fireRate: 1500,
        bulletSize: {width: 15, height: 15},
        firePattern: compilePattern({
            targeting: 'player',
            shape: 'single'
        })
    },
    burstWeapon: {
        bulletType: 5,
        bulletDamage: 2,
        bulletSpeed: 350,
        fireRate: 4000,
        bulletSize: {width: 15, height: 15},

        fireParams: {
            burst: {
                bulletCount: 4,
                delayMs: 150
            }
        },
        firePattern: compilePattern({
            targeting: 'player',
            shape: 'single'
        })
    },
    round6Weapon: {
        bulletType: 6,
        bulletDamage: 2,
        bulletSpeed: 300,
        fireRate: 3500,
        bulletSize: {width: 15, height: 15},
        firePattern: compilePattern({
            targeting: 'forward',
            shape: 'round',
            params: {
                bulletCount: 6
            }
        })
    },

    assaultWeapon: {
        bulletType: 4,
        bulletDamage: 4,
        bulletSpeed: 450,
        fireRate: 1000,
        bulletSize: {width: 15, height: 15},
        fireParams: {
            burst: {
                bulletCount: 3,
                delayMs: 120
            }
        },
        firePattern: compilePattern({
            targeting: 'player',
            shape: 'single'
        })
    },

    marksmanWeapon: {
        bulletType: 6,
        bulletDamage: 12,
        bulletSpeed: 600,
        fireRate: 2500,
        bulletSize: {width: 10, height: 10},

        firePattern: compilePattern({
            targeting: 'player',
            shape: 'single'
        })
    },

    sniperBurstWeapon: {
        bulletType: 6,
        bulletDamage: 15,
        bulletSpeed: 500,
        fireRate: 2000,
        bulletSize: {width: 10, height: 10},
        fireParams: {
            burst: {
                bulletCount: 10,
                delayMs: 100
            }
        },
        firePattern: compilePattern({
            targeting: 'player',
            shape: 'single'
        })
    },

    turretWeapon: {
        bulletType: 4,
        bulletDamage: 5,
        bulletSpeed: 350,
        muzzleOffset: 40,
        fireRate: 1500,
        bulletSize: {width: 15, height: 15},
        firePattern: compilePattern({
            targeting: 'current_rotation',
            shape: 'single'
        })
    },

    beamTurretWeapon: {
        bulletType: 5,
        bulletDamage: 8,
        bulletSpeed: 500,
        fireRate: 2000,
        muzzleOffset: 40,
        bulletSize: {width: 15, height: 15},
        fireParams: {
            burst: {
                bulletCount: 3,
                delayMs: 100
            }
        },
        firePattern: compilePattern({
            targeting: 'current_rotation',
            shape: 'single'
        })
    },
    bossBurstFastWeapon: {
        bulletType: 5,
        bulletDamage: 2,
        bulletSpeed: 350,
        fireRate: 1000,
        bulletSize: {width: 15, height: 15},

        fireParams: {
            burst: {
                bulletCount: 4,
                delayMs: 200
            }
        },
        firePattern: compilePattern({
            targeting: 'player',
            shape: 'single'
        })
    },
    bossSpreadWeapon: {
        bulletType: 1,
        bulletDamage: 7,
        bulletSpeed: 300,
        fireRate: 1000,
        bulletSize: {width: 15, height: 15},
        firePattern: compilePattern({
            targeting: 'forward',
            shape: 'spread',
            params: {
                bulletCount: 5,
                spreadAngle: 40
            }
        })
    },
    bossSpinWeapon: {
        bulletType: 4,
        bulletDamage: 4,
        bulletSpeed: 450,
        fireRate: 100,
        bulletSize: {width: 15, height: 15},
        firePattern: compilePattern({
            targeting: 'current_rotation',
            shape: 'round',
            params: {
                bulletCount: 8,
            }
        })
    },
    bossWeaverShotgun: {
        bulletType: 4,
        bulletDamage: 5,
        bulletSpeed: 350,
        fireRate: 1000,
        bulletSize: {width: 18, height: 18},
        firePattern: compilePattern({
            targeting: 'player',
            shape: 'spread',
            params: {
                bulletCount: 7,
                spreadAngle: 60
            }
        })
    },

    bossWeaverWeb: {
        bulletType: 6,
        bulletDamage: 30,
        bulletSpeed: 40,
        bulletLifetimeMs: 8000,
        fireRate: 500,
        bulletSize: {width: 20, height: 20},
        firePattern: compilePattern({
            targeting: 'forward',
            shape: 'round',
            params: {bulletCount: 12}
        })
    },
    bossWardenGatling: {
        bulletType: 1,
        bulletDamage: 4,
        bulletSpeed: 400,
        fireRate: 150,
        bulletSize: {width: 15, height: 15},
        firePattern: compilePattern({
            targeting: 'player',
            shape: 'spread',
            params: {
                bulletCount: 3,
                spreadAngle: 25
            }
        })
    },

    bossWardenFluxCross: {
        bulletType: 5,
        bulletDamage: 8,
        bulletSpeed: 500,
        fireRate: 180,
        bulletSize: {width: 15, height: 15},
        firePattern: compilePattern({
            targeting: 'current_rotation',
            shape: 'round',
            params: {bulletCount: 4}
        })
    },

    bossWardenCannon: {
        bulletType: 4,
        bulletDamage: 50,
        bulletSpeed: 250,
        fireRate: 1000,
        bulletSize: {width: 40, height: 40},
        firePattern: compilePattern({
            targeting: 'player',
            shape: 'single'
        })
    },
    bossStarNova: {
        bulletType: 6,
        bulletDamage: 10,
        bulletSpeed: 200,
        fireRate: 1200,
        bulletSize: {width: 20, height: 20},
        firePattern: compilePattern({
            targeting: 'forward',
            shape: 'round',
            params: {bulletCount: 16}
        })
    },

    bossRageBurst: {
        bulletType: 5,
        bulletDamage: 8,
        bulletSpeed: 600,
        fireRate: 500,
        bulletSize: {width: 15, height: 30},
        firePattern: compilePattern({
            targeting: 'player',
            shape: 'spread',
            params: {bulletCount: 5, spreadAngle: 30}
        })
    },
    bossArchitectRifle: {
        bulletType: 4,
        bulletDamage: 8,
        bulletSpeed: 500,
        fireRate: 1000,
        bulletSize: {width: 15, height: 15},
        firePattern: compilePattern({
            targeting: 'player',
            shape: 'single'
        })
    },

    bossArchitectShotgun: {
        bulletType: 5,
        bulletDamage: 5,
        bulletSpeed: 400,
        fireRate: 800,
        bulletSize: {width: 12, height: 12},
        firePattern: compilePattern({
            targeting: 'player',
            shape: 'spread',
            params: {bulletCount: 3, spreadAngle: 20}
        })
    },

    bossArchitectPanic: {
        bulletType: 1,
        bulletDamage: 3,
        bulletSpeed: 600,
        fireRate: 150,
        bulletSize: {width: 10, height: 10},
        firePattern: compilePattern({
            targeting: 'forward',
            shape: 'spread',
            params: {bulletCount: 2, spreadAngle: 15}
        })
    },
    bossCarrierPDL: {
        bulletType: 4,
        bulletDamage: 5,
        bulletSpeed: 500,
        fireRate: 300,
        bulletSize: {width: 10, height: 10},
        bulletLifetimeMs: 2000,
        firePattern: compilePattern({
            targeting: 'player',
            shape: 'single'
        })
    },

};

module.exports = {WEAPONS};