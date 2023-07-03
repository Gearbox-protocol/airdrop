export const mapToClaimed = (map: Record<string, bigint>) =>
  Object.entries(map).map(([address, amount]) => ({
    address,
    amount,
  }));
