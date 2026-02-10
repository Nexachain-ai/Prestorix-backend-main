exports.calculateProfitOrLoss = ({
    purchaseValue,
    currentValue,
    holdingToken,
}) => {
    const totalPurchaseCost = purchaseValue * holdingToken;
    const currentValueOfHolding = currentValue * holdingToken;
    const profitOrLoss = currentValueOfHolding - totalPurchaseCost;
    return profitOrLoss;
};

