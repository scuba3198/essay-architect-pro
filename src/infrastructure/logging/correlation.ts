export const generateCorrelationId = (): string => {
  return crypto.randomUUID();
};
