async function createComponent(recipeData, quantity) {
    try {
        const {itemCrafted} = recipeData;
        const craftedItem = Object.entries(itemCrafted)[0];
        const itemKey = craftedItem[0];
        const itemQuantity = craftedItem[1].quantity * quantity;
        const itemCategory = craftedItem[1].category;
        return {success: true, data: {key: itemKey, quantity: itemQuantity, category: itemCategory}};
    } catch (error) {
        return {success: false, error: 'Could not get itemCrafted for Blueprint'};
    }
}

module.exports = {createComponent};