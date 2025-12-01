/**
 * Format timestamp to Vietnamese relative time
 * @param timestamp - Unix timestamp in milliseconds
 * @returns Relative time string in Vietnamese
 */
export function formatRelativeTime(timestamp: number): string {
    const now = Date.now();
    const diff = now - timestamp;

    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    const weeks = Math.floor(days / 7);
    const months = Math.floor(days / 30);
    const years = Math.floor(days / 365);

    if (seconds < 60) {
        return 'Vừa xong';
    } else if (minutes < 60) {
        return `${minutes} phút trước`;
    } else if (hours < 24) {
        return `${hours} giờ trước`;
    } else if (days < 7) {
        return `${days} ngày trước`;
    } else if (weeks < 4) {
        return `${weeks} tuần trước`;
    } else if (months < 12) {
        return `${months} tháng trước`;
    } else {
        return `${years} năm trước`;
    }
}

/**
 * Format timestamp to short date string
 * @param timestamp - Unix timestamp in milliseconds
 * @returns Date string in dd/mm/yyyy format
 */
export function formatShortDate(timestamp: number): string {
    const date = new Date(timestamp);
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
}
