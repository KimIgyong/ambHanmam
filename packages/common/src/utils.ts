export const formatDate = (date: Date | string): string => {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toISOString();
};

export const generateTimestamp = (): string => {
  return new Date().toISOString();
};

export const maskEmail = (email: string): string => {
  const [local, domain] = email.split('@');
  return `${local.slice(0, 3)}**@${'*'.repeat(3)}.${domain.split('.').pop()}`;
};
