const {z} = require('zod');
const logger = require('../core/logger');

const MAX_TOKEN_ID = 100000000;

const getTokenIdParamsSchema = z.object({
    tokenId: z.string().regex(/^\d+$/, "Token ID must be a string of digits")
        .transform(Number)
        .refine(id => id >= 0, {message: "Token ID must be positive"})
        .refine(id => id <= MAX_TOKEN_ID, {message: `Token ID must be less than or equal to ${MAX_TOKEN_ID}`}),
});

/**
 * Middleware для проверки и валидации параметров URL с использованием Zod.
 */
function validateTokenId(req, res, next) {
    const result = getTokenIdParamsSchema.safeParse(req.params);

    if (!result.success) {

        const formattedErrors = result.error.format();
        const tokenIdError = formattedErrors.tokenId?._errors.join(', ') || 'Invalid format';

        logger.warn(`[Validator-Zod] Невалидный запрос для tokenId от IP ${req.ip}: ${tokenIdError}`);

        return res.status(400).json({
            error: 'Invalid request parameters',
            details: tokenIdError
        });
    }

    req.params = result.data;
    next();
}

module.exports = {
    validateTokenId
};
