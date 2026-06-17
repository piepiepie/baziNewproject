/**
 * MCP tool contract
 */
export function defineToolContract(contract) {
    return contract;
}
export function normalizeTransportDetailLevel(detailLevel) {
    if (detailLevel === 'full')
        return 'full';
    if (detailLevel === 'more')
        return 'more';
    return 'default';
}
export function mergePlaceResolutionInfo(canonicalJSON, rawResult) {
    if (typeof canonicalJSON !== 'object' || canonicalJSON === null)
        return canonicalJSON;
    if (typeof rawResult !== 'object' || rawResult === null)
        return canonicalJSON;
    if (!('placeResolutionInfo' in rawResult))
        return canonicalJSON;
    return {
        ...canonicalJSON,
        placeResolutionInfo: rawResult.placeResolutionInfo,
    };
}
