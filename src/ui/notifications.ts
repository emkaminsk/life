/**
 * Non-intrusive overlay notifications (PRD 3.12.4).
 *
 * The container (`#notificationContainer`) is a polite live region so screen
 * readers announce alerts. Content is always set with textContent – titles and
 * messages can contain file names from loaded configs, so no innerHTML.
 */
export type NotificationType = 'error' | 'warning' | 'info';

const AUTO_DISMISS_MS = 5000;
const FADE_MS = 200;

function dismiss(notification: HTMLElement): void {
  notification.style.opacity = '0';
  setTimeout(() => notification.remove(), FADE_MS);
}

export function showNotification(
  title: string,
  message: string,
  type: NotificationType = 'info',
  container: HTMLElement | null = document.getElementById('notificationContainer'),
): HTMLElement | null {
  if (!container) return null;

  const notification = document.createElement('div');
  notification.className = `notification ${type}`;

  const titleEl = document.createElement('div');
  titleEl.className = 'notification-title';
  titleEl.textContent = title;

  const messageEl = document.createElement('div');
  messageEl.className = 'notification-message';
  messageEl.textContent = message;

  notification.append(titleEl, messageEl);
  notification.addEventListener('click', () => dismiss(notification));
  setTimeout(() => dismiss(notification), AUTO_DISMISS_MS);

  container.appendChild(notification);
  return notification;
}
