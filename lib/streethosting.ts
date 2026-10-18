const STREET_HOSTING_API_URL =
  process.env.STREETHOSTING_API_URL || 'https://cloud.streethosting.com.br/api';

function getToken() {
  const token = process.env.STREETHOSTING_API_TOKEN;
  if (!token) throw new Error('STREETHOSTING_API_TOKEN não configurado');
  return token;
}

export async function streetHostingRequest<T>(path: string): Promise<T> {
  const response = await fetch(`${STREET_HOSTING_API_URL}${path}`, {
    headers: {
      Accept: 'application/json',
      Authorization: `Bearer ${getToken()}`,
    },
    cache: 'no-store',
  });

  if (!response.ok) {
    throw new Error(`StreetHosting API respondeu HTTP ${response.status}`);
  }

  return response.json() as Promise<T>;
}

export type StreetHostingAccount = {
  data: { name: string; email: string; timezone: string };
};

export type StreetHostingServer = {
  data: unknown;
};

export const streetHosting = {
  account: () => streetHostingRequest<StreetHostingAccount>('/account'),
  servers: () => streetHostingRequest<StreetHostingServer>('/server'),
};
