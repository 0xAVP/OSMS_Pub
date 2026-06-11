const {z} = require('zod');
const {isValidBlueprint, isValidModule} = require('../catalog/itemValidator');

const walletAddressSchema = z.string().regex(/^0x[a-fA-F0-9]{40}$/, {
    message: "Invalid wallet address format"
});

const uidSchema = z.string().uuid({
    message: "Invalid UID format"
});

const emptyPayloadSchema = z.object({}).strict({
    message: "Payload must be an empty object"
});

const existingBlueprintKeySchema = z.string().refine(
    (key) => isValidBlueprint(key),
    {
        message: "Blueprint with this key does not exist or is not valid."
    }
);

const getTransactionHistorySchema = z.object({

    category: z.enum(['tokens', 'ships'], {
        required_error: "Category is required",
        invalid_type_error: "Category must be either 'tokens' or 'ships'"
    }),

    limit: z.number().int().positive().max(100).optional(),
    offset: z.number().int().nonnegative().optional()
}).strict({
    message: "Invalid payload for transaction history."
});

const startCraftSchema = z.object({
    blueprintKey: existingBlueprintKeySchema,
    itemToCraftQuantity: z.number()
        .int()
        .positive({message: "Quantity must be positive"})
        .max(100, {message: "Cannot craft more than 100 items at once"}),
}).strict({
    message: "Payload must contain exactly blueprintKey and itemToCraftQuantity"
});

const finishCraftSchema = z.object({
    factoryUid: uidSchema,
    factoryName: z.enum(['factory1', 'factory2', 'factory3'], {
        invalid_type_error: "Invalid factory name. Must be 'factory1', 'factory2', or 'factory3'."
    }),
}).strict({
    message: "Payload must contain exactly factoryUid and factoryName"
});

const cancelCraftSchema = z.object({
    factoryUid: uidSchema,
    factoryName: z.enum(['factory1', 'factory2', 'factory3'], {
        invalid_type_error: "Invalid factory name. Must be 'factory1', 'factory2', or 'factory3'."
    }),
}).strict({
    message: "Payload must contain exactly factoryUid and factoryName"
});

const existingModuleKeySchema = z.string().refine(isValidModule, {
    message: "Module with this key does not exist in the catalog."
});

const dismantleModuleSchema = z.object({
    moduleKey: existingModuleKeySchema,
    moduleUid: uidSchema,
}).strict({
    message: "Must contain exactly moduleKey and moduleUid"
});

const upgradeInventoryModuleSchema = z.object({
    moduleUid: uidSchema,
    moduleKey: existingModuleKeySchema,
    moduleLevel: z.number().int().positive({message: "Level must be a positive integer"}),
    itemToUpgradeQuantity: z.number().int()
        .positive({message: "Upgrade quantity must be positive"})
        .max(100, {message: "Cannot upgrade more than 100 levels at once"}),
}).strict({
    message: "Payload must contain exactly moduleUid, moduleKey, moduleLevel, and itemToUpgradeQuantity"
});

const upgradeShipModuleSchema = z.object({
    shipId: z.number().int().nonnegative(),
    moduleUid: uidSchema,
    moduleKey: existingModuleKeySchema,
    moduleLevel: z.number().int().positive(),
    itemToUpgradeQuantity: z.number().int().positive().max(100),
}).strict({
    message: "Payload must contain exactly 5 specified fields"
});

const installShipModuleSchema = z.object({
    shipId: z.number().int().nonnegative(),
    installingModuleUid: uidSchema,
    installingModuleKey: existingModuleKeySchema,
    toSlot: z.enum(['weapon1', 'weapon2', 'shield', 'armor', 'engine']),
    slotUid: uidSchema,

    existingModuleUid: uidSchema.nullable(),
}).strict({
    message: "Payload must contain exactly 6 specified fields"
});

const sendItemSchema = z.object({

    itemKey: z.string().regex(/^[a-z0-9_]{3,40}$/, "Invalid item key format"),
    itemUid: uidSchema.nullable(),
    quantity: z.number().int().positive(),
    recipientAddress: walletAddressSchema,
}).strict({
    message: "Payload must contain exactly 4 specified fields"
});

const claimItemFromMailSchema = z.object({
    mailId: z.string()

        .nonempty({message: "Mail ID cannot be empty"})

        .regex(/^[a-f\d]{24}$/i, {message: "Invalid Mail ID format"}),
}).strict({
    message: "Payload must contain exactly mailId"
});

const deleteMailSchema = z.object({
    mailId: z.string()
        .nonempty({message: "Mail ID cannot be empty"})
        .regex(/^[a-f\d]{24}$/i, {message: "Invalid Mail ID format"}),
}).strict({
    message: "Payload must contain exactly mailId"
});

const getMailsSchema = z.object({
    folder: z.enum(['inbox', 'sent']),
}).strict({
    message: "Payload must contain exactly 'folder'"
});

const useItemSchema = z.object({
    itemId: z.string().nonempty({message: "Item ID cannot be empty"}),
}).strict({
    message: "Payload must contain exactly 'itemId'"
});

const getLeaderboardSchema = z.object({
    seasonNumber: z.number().int().positive().optional(),

    count: z.number().int().positive().max(100).optional(),
    offset: z.number().int().nonnegative().optional(),
}).strict({
    message: "Payload can only contain seasonNumber, count, and offset"
});

module.exports = {
    startCraftSchema,
    finishCraftSchema,
    cancelCraftSchema,
    dismantleModuleSchema,
    upgradeInventoryModuleSchema,
    upgradeShipModuleSchema,
    installShipModuleSchema,
    sendItemSchema,
    claimItemFromMailSchema,
    deleteMailSchema,
    getMailsSchema,
    useItemSchema,
    getLeaderboardSchema,
    emptyPayloadSchema,
    getTransactionHistorySchema,
    walletAddressSchema,
    uidSchema,
};