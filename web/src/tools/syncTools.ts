export function generateSyncId(): string {
    const randomUUID = crypto.randomUUID();
    return randomUUID.substring(0, 6);
}