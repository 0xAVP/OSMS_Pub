const {z} = require('zod');
const CONFIG = require('./config');
const {CAK} = require('./gameStateKeys');

const startGameSchema = z.object({
    sessionToken: z.string().max(CONFIG.validation.SESSION_TOKEN_MAX_LENGTH),
    walletAddress: z.string().regex(CONFIG.validation.WALLET_ADDRESS_REGEX, {message: "Invalid walletAddress format"}),
    shipTokenId: z.number().int().nonnegative(),
    pilotId: z.number().int().min(0).max(CONFIG.validation.rules.MAX_PILOT_ID),
    map: z.number().int().min(0).max(CONFIG.validation.rules.MAX_MAP_ID),
    startWidth: z.number().int().min(0).max(CONFIG.validation.world.MAX_WIDTH),
    startHeight: z.number().int().min(0).max(CONFIG.validation.world.MAX_HEIGHT),
}).strict();

const reconnectRequestSchema = z.object({
    walletAddress: z.string().regex(CONFIG.validation.WALLET_ADDRESS_REGEX),
    reconnectToken: z.string().uuid()
}).strict();

const playerActionSchema = z.tuple([

    z.number().min(0).max(CONFIG.validation.world.MAX_WIDTH),

    z.number().min(0).max(CONFIG.validation.world.MAX_HEIGHT),

    z.number().positive().refine((timestamp) => {
        const now = Date.now();
        const tolerance = CONFIG.validation.TIMESTAMP_TOLERANCE_MS;
        return timestamp >= (now - tolerance) && timestamp <= (now + tolerance);
    }, {message: "Timestamp is out of tolerance range"}),

    z.number().int().nonnegative(),

    z.union([z.literal(1), z.null()]).optional(),
]);

const playerActionsSchema = z.array(playerActionSchema)
    .min(0)
    .max(CONFIG.validation.MAX_ACTIONS_PER_PACKET);

const emptyPayloadSchema = z.union([
    z.null(),
    z.undefined(),
    z.object({}).strict()
]);

const hitClaimSchema = z.tuple([

    z.number().int().nonnegative(),

    z.number().int().nonnegative(),

    z.number().int().nonnegative(),

    z.number().positive()
]);

module.exports = {
    startGameSchema,
    playerActionsSchema,
    emptyPayloadSchema,
    hitClaimSchema,
    reconnectRequestSchema
};