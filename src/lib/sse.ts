type SSEClient = (event: string, data: unknown) => void;

const clients = new Set<SSEClient>();

export function addClient(client: SSEClient) {
  clients.add(client);
}

export function removeClient(client: SSEClient) {
  clients.delete(client);
}

export function broadcast(event: string, data: unknown) {
  for (const client of clients) {
    try {
      client(event, data);
    } catch {
      clients.delete(client);
    }
  }
}

export function getClientCount() {
  return clients.size;
}
