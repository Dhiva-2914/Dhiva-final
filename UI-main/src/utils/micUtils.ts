/**
 * Robust microphone activation for Web Speech API and getUserMedia, with diagnostics for iframe, sandbox, HTTPS, and permissions.
 * Usage: call setupMicButton('mic-btn', onMicAllowed) to ensure user gesture and best practices.
 */
export async function activateMicrophone(onAllowed: (stream: MediaStream|null) => void) {
  // 1. Check if in iframe and warn if allow="microphone" is missing
  if (window.self !== window.top) {
    console.warn('App is running inside an iframe. Ensure the iframe has allow="microphone" and proper sandbox attributes.');
  }
  // 2. Check protocol
  if (window.location.protocol !== 'https:' && window.location.hostname !== 'localhost') {
    alert('Microphone access requires HTTPS or localhost.');
    onAllowed(null);
    return;
  }
  // 3. Check permission state if supported
  if (navigator.permissions && navigator.permissions.query) {
    try {
      const status = await navigator.permissions.query({ name: 'microphone' as PermissionName });
      console.log('Mic permission status:', status.state);
      if (status.state === 'denied') {
        alert('Microphone access is blocked. Please allow it in your browser settings.');
        onAllowed(null);
        return;
      }
    } catch (e) {
      // Permissions API not available or failed, continue to request
    }
  }
  // 4. Request mic access (must be from user gesture)
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    onAllowed(stream);
  } catch (err: any) {
    if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
      alert('Microphone access was denied. Please check your browser and OS settings.');
    } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
      alert('No microphone was found. Please connect a microphone.');
    } else if (err.name === 'NotReadableError' || err.name === 'TrackStartError') {
      alert('Microphone is already in use by another application.');
    } else {
      alert('An unknown error occurred while accessing the microphone.');
    }
    console.error('Mic access denied:', err);
    onAllowed(null);
  }
}



// Utility for robust microphone access with permission checks and error handling
//
// IMPORTANT: If your app is embedded in an iframe (e.g., in Confluence), ensure the iframe tag includes:
//   <iframe src="your-app.html" allow="microphone"></iframe>
// If you use sandbox, add:
//   <iframe sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-modals allow-pointer-lock allow-speech" ...>
//
// Always call requestMicrophoneAccess() from a user gesture (e.g., button click).

/**
 * Requests microphone access with robust permission and context checks.
 * Must be called from a user gesture (e.g., click handler).
 */
export async function requestMicrophoneAccess(): Promise<MediaStream|null> {
  // 1. Check if running inside an iframe and warn if allow="microphone" is missing
  if (window.self !== window.top) {
    console.warn('App is running inside an iframe. Ensure the iframe has allow="microphone" and proper sandbox attributes.');
  }
  // 2. Check protocol
  if (window.location.protocol !== 'https:' && window.location.hostname !== 'localhost') {
    alert('Microphone access requires HTTPS or localhost.');
    return null;
  }
  // 3. Check permission state if supported
  if (navigator.permissions && navigator.permissions.query) {
    try {
      const status = await navigator.permissions.query({ name: 'microphone' as PermissionName });
      console.log('Mic permission status:', status.state); // 'granted', 'denied', or 'prompt'
      if (status.state === 'denied') {
        alert('Microphone access is blocked. Please allow it in your browser settings.');
        return null;
      }
    } catch (e) {
      // Permissions API not available or failed, continue to request
    }
  }
  // 4. Request mic access (must be from user gesture)
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    return stream;
  } catch (err: any) {
    if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
      alert('Microphone access was denied. Please check your browser and OS settings.');
    } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
      alert('No microphone was found. Please connect a microphone.');
    } else if (err.name === 'NotReadableError' || err.name === 'TrackStartError') {
      alert('Microphone is already in use by another application.');
    } else {
      alert('An unknown error occurred while accessing the microphone.');
    }
    console.error('Mic access denied:', err);
    return null;
  }
}

/**
 * Helper to wire up a mic button with correct user gesture and permission checks.
 * Usage: call setupMicButton('mic-btn', (stream) => { ... });
 */
export function setupMicButton(buttonId: string, onStream: (stream: MediaStream|null) => void) {
  const btn = document.getElementById(buttonId);
  if (!btn) {
    console.warn('Mic button not found:', buttonId);
    return;
  }
  btn.onclick = async () => {
    const stream = await requestMicrophoneAccess();
    onStream(stream);
  };
}

/**
 * Diagnostic script to help troubleshoot microphone access issues in embedded/iframe apps.
 * Call this from a user gesture (e.g., button click) and check the console output.
 */
export async function diagnoseMicAccess() {
  // 1. Check if in iframe
  const inIframe = window.self !== window.top;
  console.log('In iframe:', inIframe);
  if (inIframe) {
    console.log('Check your iframe HTML for allow="microphone" and sandbox permissions.');
  }
  // 2. Check protocol
  console.log('Page protocol:', window.location.protocol);
  // 3. Check permissions API
  if (navigator.permissions && navigator.permissions.query) {
    try {
      const status = await navigator.permissions.query({ name: 'microphone' as PermissionName });
      console.log('Microphone permission state:', status.state);
    } catch (e) {
      console.warn('Permissions API error:', e);
    }
  } else {
    console.warn('Permissions API not supported');
  }
  // 4. Print user agent and origin
  console.log('User agent:', navigator.userAgent);
  console.log('Page origin:', window.location.origin);
  // 5. Try to enumerate devices
  if (navigator.mediaDevices && navigator.mediaDevices.enumerateDevices) {
    const devices = await navigator.mediaDevices.enumerateDevices();
    const mics = devices.filter(d => d.kind === 'audioinput');
    console.log('Detected microphones:', mics);
  }
  // 6. Advise on Chrome site settings
  console.log('Check chrome://settings/content/microphone and ensure this site and parent Confluence domain are not blocked.');
} 